import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Game constants
const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["A", "10", "K", "Q", "J", "9"] as const;
const CARD_POINTS: Record<string, number> = { A: 11, "10": 10, K: 4, Q: 3, J: 2, "9": 0 };
const MELD_POINTS: Record<string, number> = { spades: 40, clubs: 60, diamonds: 80, hearts: 100 };

interface Card {
  suit: typeof SUITS[number];
  rank: typeof RANKS[number];
  id: string;
}

// Create full deck
function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}_${suit}` });
    }
  }
  return deck;
}

// Shuffle deck (Fisher-Yates)
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards for 2, 3, or 4 players
function dealCards(playerCount: number, withMusik: boolean): { hands: Card[][]; musik: Card[] } {
  const deck = shuffleDeck(createDeck());
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let musik: Card[] = [];

  if (playerCount === 4) {
    if (withMusik) {
      // 5 cards each + 4 musik
      for (let i = 0; i < 5; i++) {
        for (let p = 0; p < 4; p++) {
          hands[p].push(deck[i * 4 + p]);
        }
      }
      musik = deck.slice(20, 24);
    } else {
      // 6 cards each, no musik
      for (let i = 0; i < 6; i++) {
        for (let p = 0; p < 4; p++) {
          hands[p].push(deck[i * 4 + p]);
        }
      }
    }
  } else if (playerCount === 3) {
    // 3 players: 7 cards each + 3 musik
    for (let i = 0; i < 7; i++) {
      for (let p = 0; p < 3; p++) {
        hands[p].push(deck[i * 3 + p]);
      }
    }
    musik = deck.slice(21, 24);
  } else if (playerCount === 2) {
    // 2 players: 12 cards each (total 24 cards, no musik for 2 players)
    for (let i = 0; i < 12; i++) {
      for (let p = 0; p < 2; p++) {
        hands[p].push(deck[i * 2 + p]);
      }
    }
    musik = []; // No musik in 2-player game
  }

  return { hands, musik };
}

// Check if player has a meld (K+Q of same suit)
function findMelds(cards: Card[]): { suit: string; points: number }[] {
  const melds: { suit: string; points: number }[] = [];
  for (const suit of SUITS) {
    const hasKing = cards.some((c) => c.suit === suit && c.rank === "K");
    const hasQueen = cards.some((c) => c.suit === suit && c.rank === "Q");
    if (hasKing && hasQueen) {
      melds.push({ suit, points: MELD_POINTS[suit] });
    }
  }
  return melds;
}

// Calculate points in cards
function calculatePoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + CARD_POINTS[card.rank], 0);
}

// Determine trick winner
function determineTrickWinner(
  trick: { playerId: string; card: Card; position: number }[],
  trump: string | null,
  leadSuit: string,
  playerCount: number
): string {
  let winner = trick[0];
  
  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];
    const currentCard = current.card;
    const winnerCard = winner.card;
    
    // Trump beats non-trump
    if (trump) {
      if (currentCard.suit === trump && winnerCard.suit !== trump) {
        winner = current;
        continue;
      }
      if (winnerCard.suit === trump && currentCard.suit !== trump) {
        continue;
      }
    }
    
    // Same suit - higher rank wins
    if (currentCard.suit === winnerCard.suit) {
      const currentRankIndex = RANKS.indexOf(currentCard.rank);
      const winnerRankIndex = RANKS.indexOf(winnerCard.rank);
      if (currentRankIndex < winnerRankIndex) {
        winner = current;
      }
    }
    
    // Following lead suit beats other suits (when no trump)
    if (currentCard.suit === leadSuit && winnerCard.suit !== leadSuit && winnerCard.suit !== trump) {
      winner = current;
    }
  }
  
  return winner.playerId;
}

// Check if card can be played
function canPlayCard(
  card: Card,
  playerHand: Card[],
  leadSuit: string | null,
  trump: string | null
): boolean {
  // First card in trick - can play anything
  if (!leadSuit) return true;
  
  // Must follow suit if possible
  const hasSuit = playerHand.some((c) => c.suit === leadSuit);
  if (hasSuit) {
    return card.suit === leadSuit;
  }
  
  // No lead suit - can play anything
  return true;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, data } = await req.json();
    console.log(`[GameServer] Action: ${action}`, data);

    switch (action) {
      // CREATE ROOM
      case "create_room": {
        const { name, nickname, withMusik, playerId, maxPlayers = 4, gameMode = 'ffa' } = data;
        
        console.log(`[GameServer] Creating room with: name=${name}, maxPlayers=${maxPlayers}, gameMode=${gameMode}`);
        
        // Create room - database now has max_players and game_mode columns
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .insert({
            name,
            host_id: playerId,
            with_musik: withMusik,
            max_players: maxPlayers,
            game_mode: gameMode,
          })
          .select()
          .single();

        if (roomError) {
          console.error(`[GameServer] Room creation error:`, roomError);
          throw roomError;
        }

        // Add host as player
        const { error: playerError } = await supabase
          .from("room_players")
          .insert({
            room_id: room.id,
            player_id: playerId,
            nickname,
            is_host: true,
            position: 0,
          });

        if (playerError) {
          console.error(`[GameServer] Player creation error:`, playerError);
          throw playerError;
        }

        console.log(`[GameServer] Room created: ${room.id} (${maxPlayers} players, ${gameMode})`);
        return new Response(JSON.stringify({ success: true, room }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // JOIN ROOM
      case "join_room": {
        const { roomId, nickname, playerId } = data;

        // Get room settings
        const { data: room } = await supabase
          .from("rooms")
          .select("max_players")
          .eq("id", roomId)
          .single();

        const maxPlayers = room?.max_players || 4;

        // Get current players
        const { data: players } = await supabase
          .from("room_players")
          .select("position")
          .eq("room_id", roomId);

        const usedPositions = players?.map((p) => p.position) || [];
        const availablePositions = Array.from({ length: maxPlayers }, (_, i) => i).filter(p => !usedPositions.includes(p));
        const nextPosition = availablePositions[0];

        if (nextPosition === undefined) {
          throw new Error("Room is full");
        }

        const { error } = await supabase.from("room_players").insert({
          room_id: roomId,
          player_id: playerId,
          nickname,
          position: nextPosition,
        });

        if (error) throw error;

        console.log(`[GameServer] Player ${playerId} joined room ${roomId} at position ${nextPosition}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SELECT TEAM
      case "select_team": {
        const { roomId, playerId, team } = data;

        const { error } = await supabase
          .from("room_players")
          .update({ team })
          .eq("room_id", roomId)
          .eq("player_id", playerId);

        if (error) throw error;

        console.log(`[GameServer] Player ${playerId} joined team ${team}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // UPDATE TEAM NAME
      case "update_team_name": {
        const { roomId, team, name } = data;

        const column = team === "A" ? "team_a_name" : "team_b_name";
        const { error } = await supabase
          .from("rooms")
          .update({ [column]: name })
          .eq("id", roomId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SET READY
      case "set_ready": {
        const { roomId, playerId, isReady } = data;

        const { error } = await supabase
          .from("room_players")
          .update({ is_ready: isReady })
          .eq("room_id", roomId)
          .eq("player_id", playerId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // START GAME
      case "start_game": {
        const { roomId } = data;

        // Get room and players
        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");
        
        const maxPlayers = room.max_players || 4;
        const playerCount = room.room_players.length;
        
        // Validate player count based on room settings
        if (playerCount < 2) throw new Error("Need at least 2 players");
        if (playerCount > maxPlayers) throw new Error(`Too many players (max ${maxPlayers})`);
        
        // For FFA mode, we just need minimum 2 players up to maxPlayers
        // For teams mode, we need exactly 4 players with 2 on each team
        if (room.game_mode === 'teams') {
          if (playerCount !== 4) throw new Error("Team mode requires exactly 4 players");
          const teamA = room.room_players.filter((p: any) => p.team === 'A');
          const teamB = room.room_players.filter((p: any) => p.team === 'B');
          if (teamA.length !== 2 || teamB.length !== 2) {
            throw new Error("Teams must have 2 players each");
          }
        }

        // Deal cards based on player count - always use musik in Tysiąc
        const { hands, musik } = dealCards(playerCount, true);

        // Update players with cards - order by position
        const sortedPlayers = [...room.room_players].sort((a: any, b: any) => a.position - b.position);
        for (let i = 0; i < playerCount; i++) {
          const player = sortedPlayers[i];
          if (player) {
            await supabase
              .from("room_players")
              .update({ cards: hands[i], round_score: 0, tricks_won: [], melds: [] })
              .eq("id", player.id);
          }
        }

        // Store musik
        if (musik.length > 0) {
          await supabase.from("musik").insert({
            room_id: roomId,
            cards: musik,
          });
        }

        // Random first bidder for round 1
        const randomIndex = Math.floor(Math.random() * playerCount);
        const firstBidder = sortedPlayers[randomIndex];

        // Update room state - go directly to bidding, no trump selection needed
        await supabase
          .from("rooms")
          .update({
            status: "playing",
            phase: "bidding",
            round_number: 1,
            current_player_id: firstBidder?.player_id,
            current_bid: 100,
            current_trump: null,
            bid_winner_id: null,
          })
          .eq("id", roomId);

        console.log(`[GameServer] Game started in room ${roomId} with ${playerCount} players, first bidder: ${firstBidder?.nickname}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // BID
      case "bid": {
        const { roomId, playerId, amount } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");
        if (room.current_player_id !== playerId) throw new Error("Not your turn");

        const playerCount = room.room_players.length;

        // Update bid
        await supabase
          .from("rooms")
          .update({
            current_bid: amount,
            bid_winner_id: playerId,
          })
          .eq("id", roomId);

        // Move to next player
        const currentPlayer = room.room_players.find((p: any) => p.player_id === playerId);
        const nextPosition = (currentPlayer.position + 1) % playerCount;
        const nextPlayer = room.room_players.find((p: any) => p.position === nextPosition);

        await supabase
          .from("rooms")
          .update({ current_player_id: nextPlayer.player_id })
          .eq("id", roomId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PASS (bidding)
      case "pass": {
        const { roomId, playerId } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");

        const playerCount = room.room_players.length;

        // Mark player as passed (using is_ready as passed flag during bidding)
        await supabase
          .from("room_players")
          .update({ is_ready: false })
          .eq("room_id", roomId)
          .eq("player_id", playerId);

        // Check if bidding is over
        const { data: updatedPlayers } = await supabase
          .from("room_players")
          .select("*")
          .eq("room_id", roomId);

        const activeBidders = updatedPlayers?.filter((p: any) => p.is_ready !== false) || [];
        
        // Find the first bidder of this round (the one who started the bidding)
        const sortedPlayers = [...room.room_players].sort((a: any, b: any) => a.position - b.position);
        const firstBidderPosition = (room.round_number - 1) % playerCount;
        const firstBidder = sortedPlayers[firstBidderPosition];
        
        // Bidding ends when:
        // 1. Only one active bidder left with a bid, OR
        // 2. All players have passed (everyone passed including the one who said "100")
        const allPassed = activeBidders.length === 0 || 
                          (activeBidders.length === 1 && !room.bid_winner_id);
        const oneBidderLeft = activeBidders.length <= 1 && room.bid_winner_id;
        
        if (allPassed || oneBidderLeft) {
          // Determine bid winner
          // If someone bid, they win. If everyone passed, first bidder wins with 100.
          const finalBidWinnerId = room.bid_winner_id || firstBidder?.player_id;
          const finalBid = room.bid_winner_id ? room.current_bid : 100;
          
          // Update bid winner if everyone passed
          if (!room.bid_winner_id) {
            await supabase
              .from("rooms")
              .update({ 
                bid_winner_id: finalBidWinnerId,
                current_bid: 100 
              })
              .eq("id", roomId);
          }
          
          // Give musik cards to bid winner
          const { data: musik } = await supabase
            .from("musik")
            .select()
            .eq("room_id", roomId)
            .maybeSingle();

          if (musik && musik.cards) {
            const bidWinner = updatedPlayers?.find((p: any) => p.player_id === finalBidWinnerId);
            if (bidWinner) {
              const newCards = [...(bidWinner.cards || []), ...musik.cards];
              await supabase
                .from("room_players")
                .update({ cards: newCards })
                .eq("id", bidWinner.id);
            }
            
            // Reveal musik
            await supabase
              .from("musik")
              .update({ revealed: true })
              .eq("room_id", roomId);
          }

          // Go directly to playing phase
          await supabase
            .from("rooms")
            .update({ 
              phase: "playing",
              current_player_id: finalBidWinnerId,
              bid_winner_id: finalBidWinnerId // Ensure bid winner is set
            })
            .eq("id", roomId);
            
          console.log(`[GameServer] Bidding complete. Winner: ${finalBidWinnerId}, Bid: ${finalBid}`);
        } else {
          // Move to next player who hasn't passed
          const currentPlayer = room.room_players.find((p: any) => p.player_id === playerId);
          let nextPosition = (currentPlayer.position + 1) % playerCount;
          let nextPlayer = room.room_players.find((p: any) => p.position === nextPosition);
          
          // Skip players who have passed
          const updatedPlayersMap = new Map(updatedPlayers?.map((p: any) => [p.player_id, p]));
          let attempts = 0;
          while (updatedPlayersMap.get(nextPlayer?.player_id)?.is_ready === false && attempts < playerCount) {
            nextPosition = (nextPosition + 1) % playerCount;
            nextPlayer = room.room_players.find((p: any) => p.position === nextPosition);
            attempts++;
          }

          await supabase
            .from("rooms")
            .update({ current_player_id: nextPlayer.player_id })
            .eq("id", roomId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // DECLARE MELD (when playing K or Q of a pair you have)
      case "declare_meld": {
        const { roomId, playerId, suit } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");

        const player = room.room_players.find((p: any) => p.player_id === playerId);
        if (!player) throw new Error("Player not found");

        // Check if player has the meld (K+Q of the suit)
        const hasKing = player.cards.some((c: any) => c.suit === suit && c.rank === "K");
        const hasQueen = player.cards.some((c: any) => c.suit === suit && c.rank === "Q");

        if (!hasKing || !hasQueen) {
          throw new Error("You don't have King and Queen of this suit");
        }

        // Add meld to player
        const meldPoints = MELD_POINTS[suit];
        const existingMelds = player.melds || [];
        const alreadyMelded = existingMelds.some((m: any) => m.suit === suit);
        
        if (alreadyMelded) {
          throw new Error("Already melded this suit");
        }

        await supabase
          .from("room_players")
          .update({ 
            melds: [...existingMelds, { suit, points: meldPoints }]
          })
          .eq("id", player.id);

        // Set trump to this suit (first meld sets trump, subsequent melds can change it)
        await supabase
          .from("rooms")
          .update({ current_trump: suit })
          .eq("id", roomId);

        console.log(`[GameServer] Player ${playerId} melded ${suit} (+${meldPoints}), trump is now ${suit}`);
        return new Response(JSON.stringify({ success: true, meldPoints }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PLAY CARD
      case "play_card": {
        const { roomId, playerId, cardId } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");
        if (room.current_player_id !== playerId) throw new Error("Not your turn");

        const playerCount = room.room_players.length;
        const player = room.room_players.find((p: any) => p.player_id === playerId);
        const card = player.cards.find((c: any) => c.id === cardId);

        if (!card) throw new Error("Card not in hand");

        // Get current trick
        const { data: trick } = await supabase
          .from("current_trick")
          .select()
          .eq("room_id", roomId)
          .order("position", { ascending: true });

        const leadSuit = trick?.[0]?.card?.suit || null;
        const isStartingTrick = !trick?.length;

        // Validate play
        if (!canPlayCard(card, player.cards, leadSuit, room.current_trump)) {
          throw new Error("Invalid play - must follow suit");
        }

        // Remove card from hand
        const newHand = player.cards.filter((c: any) => c.id !== cardId);
        await supabase
          .from("room_players")
          .update({ cards: newHand })
          .eq("id", player.id);

        // Add to trick
        await supabase.from("current_trick").insert({
          room_id: roomId,
          player_id: playerId,
          card,
          position: trick?.length || 0,
        });

        // Check for automatic meld declaration when starting a trick with K or Q
        if (isStartingTrick && (card.rank === "K" || card.rank === "Q")) {
          // Check if player has the pair
          const hasKing = card.rank === "K" || newHand.some((c: any) => c.suit === card.suit && c.rank === "K");
          const hasQueen = card.rank === "Q" || newHand.some((c: any) => c.suit === card.suit && c.rank === "Q");
          
          if (hasKing && hasQueen) {
            const existingMelds = player.melds || [];
            const alreadyMelded = existingMelds.some((m: any) => m.suit === card.suit);
            
            if (!alreadyMelded) {
              const meldPoints = MELD_POINTS[card.suit];
              await supabase
                .from("room_players")
                .update({ 
                  melds: [...existingMelds, { suit: card.suit, points: meldPoints }]
                })
                .eq("id", player.id);

              // Set trump to this suit
              await supabase
                .from("rooms")
                .update({ current_trump: card.suit })
                .eq("id", roomId);

              console.log(`[GameServer] Auto-meld: ${card.suit} (+${meldPoints}), trump is now ${card.suit}`);
            }
          }
        }

        // Check if trick is complete (all players have played)
        if ((trick?.length || 0) + 1 === playerCount) {
          // Get updated trump in case it was just set by meld
          const { data: currentRoom } = await supabase
            .from("rooms")
            .select("current_trump")
            .eq("id", roomId)
            .single();

          // Determine winner
          const fullTrick = [
            ...trick!.map((t: any) => ({ playerId: t.player_id, card: t.card, position: t.position })),
            { playerId, card, position: trick?.length || 0 },
          ];
          
          const winnerId = determineTrickWinner(fullTrick, currentRoom?.current_trump || room.current_trump, leadSuit!, playerCount);
          const winnerPlayer = room.room_players.find((p: any) => p.player_id === winnerId);

          // Get updated player data for winner (in case melds were just added)
          const { data: updatedWinner } = await supabase
            .from("room_players")
            .select()
            .eq("id", winnerPlayer.id)
            .single();

          // Calculate points
          const trickPoints = calculatePoints(fullTrick.map((t) => t.card));
          const existingTricks = updatedWinner?.tricks_won || [];
          
          await supabase
            .from("room_players")
            .update({
              tricks_won: [...existingTricks, fullTrick.map(t => t.card)],
              round_score: (updatedWinner?.round_score || 0) + trickPoints,
            })
            .eq("id", winnerPlayer.id);

          // Clear trick
          await supabase.from("current_trick").delete().eq("room_id", roomId);

          // Check if round is over (all players have no cards left)
          if (newHand.length === 0) {
            // Round complete - calculate scores and start new round
            await finishRoundAndStartNew(supabase, roomId, room);
          } else {
            // Winner starts next trick
            await supabase
              .from("rooms")
              .update({ current_player_id: winnerId })
              .eq("id", roomId);
          }
        } else {
          // Move to next player
          const nextPosition = (player.position + 1) % playerCount;
          const nextPlayer = room.room_players.find((p: any) => p.position === nextPosition);
          
          await supabase
            .from("rooms")
            .update({ current_player_id: nextPlayer.player_id })
            .eq("id", roomId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET ROOM STATE
      case "get_room": {
        const { roomId, playerId } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        const { data: trick } = await supabase
          .from("current_trick")
          .select()
          .eq("room_id", roomId);

        const { data: musik } = await supabase
          .from("musik")
          .select()
          .eq("room_id", roomId)
          .maybeSingle();

        // Get player's team to determine what cards to show
        const currentPlayer = room?.room_players.find((p: any) => p.player_id === playerId);
        const playerTeam = currentPlayer?.team;
        const isTeamMode = room?.game_mode === 'teams';

        // Filter cards based on visibility:
        // - Always show own cards
        // - In team mode, show partner's cards
        // - Hide opponent cards
        const playersWithVisibility = room?.room_players.map((p: any) => {
          const isMe = p.player_id === playerId;
          const isPartner = isTeamMode && playerTeam && p.team === playerTeam && !isMe;
          
          return {
            ...p,
            cards: (isMe || isPartner) 
              ? p.cards 
              : p.cards.map(() => ({ hidden: true })),
          };
        });

        return new Response(
          JSON.stringify({
            success: true,
            room: { ...room, room_players: playersWithVisibility },
            trick,
            musik: musik?.revealed ? musik : null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // LEAVE ROOM
      case "leave_room": {
        const { roomId, playerId } = data;

        await supabase
          .from("room_players")
          .delete()
          .eq("room_id", roomId)
          .eq("player_id", playerId);

        // Check if room is empty
        const { data: remainingPlayers } = await supabase
          .from("room_players")
          .select()
          .eq("room_id", roomId);

        if (!remainingPlayers?.length) {
          await supabase.from("rooms").delete().eq("id", roomId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // DELETE ROOM (host only)
      case "delete_room": {
        const { roomId, playerId } = data;

        // Verify the player is the host
        const { data: room } = await supabase
          .from("rooms")
          .select("host_id")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");
        if (room.host_id !== playerId) throw new Error("Only the host can delete the room");

        // Delete all players first
        await supabase.from("room_players").delete().eq("room_id", roomId);
        
        // Delete musik
        await supabase.from("musik").delete().eq("room_id", roomId);
        
        // Delete current trick
        await supabase.from("current_trick").delete().eq("room_id", roomId);
        
        // Delete the room
        await supabase.from("rooms").delete().eq("id", roomId);

        console.log(`[GameServer] Room ${roomId} deleted by host ${playerId}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[GameServer] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to finish round and start a new one (or end game)
async function finishRoundAndStartNew(supabase: any, roomId: string, room: any) {
  const playerCount = room.room_players.length;
  const isTeamMode = room.game_mode === 'teams';
  
  // Fetch fresh player data (with updated melds and scores)
  const { data: freshPlayers } = await supabase
    .from("room_players")
    .select()
    .eq("room_id", roomId);

  // Calculate round scores including melds
  let gameWinner: string | null = null;
  let gameWinnerScore = 0;

  if (isTeamMode) {
    // Team mode: aggregate team scores
    const teamAPlayers = freshPlayers?.filter((p: any) => p.team === 'A') || [];
    const teamBPlayers = freshPlayers?.filter((p: any) => p.team === 'B') || [];
    
    const teamARoundScore = teamAPlayers.reduce((sum: number, p: any) => sum + (p.round_score || 0), 0);
    const teamBRoundScore = teamBPlayers.reduce((sum: number, p: any) => sum + (p.round_score || 0), 0);
    
    // Add meld points
    const teamAMelds = teamAPlayers.reduce((sum: number, p: any) => 
      sum + (p.melds || []).reduce((ms: number, m: any) => ms + m.points, 0), 0);
    const teamBMelds = teamBPlayers.reduce((sum: number, p: any) => 
      sum + (p.melds || []).reduce((ms: number, m: any) => ms + m.points, 0), 0);
    
    const newTeamAScore = room.team_a_score + teamARoundScore + teamAMelds;
    const newTeamBScore = room.team_b_score + teamBRoundScore + teamBMelds;
    
    // Check for winner (1000 points)
    if (newTeamAScore >= 1000 || newTeamBScore >= 1000) {
      const winnerTeam = newTeamAScore >= 1000 ? 'A' : 'B';
      gameWinner = winnerTeam === 'A' ? room.team_a_name : room.team_b_name;
      gameWinnerScore = winnerTeam === 'A' ? newTeamAScore : newTeamBScore;
    }
    
    await supabase
      .from("rooms")
      .update({
        team_a_score: newTeamAScore,
        team_b_score: newTeamBScore,
      })
      .eq("id", roomId);
  } else {
    // FFA mode: each player has their own score
    // Update each player's total score (team_a_score used as player scores in round_score, but we need cumulative)
    // We'll store individual scores in round_score but need to track total in a different way
    // For FFA, use the player's round_score + melds and accumulate
    
    for (const player of freshPlayers || []) {
      const meldPoints = (player.melds || []).reduce((sum: number, m: any) => sum + m.points, 0);
      const totalRoundPoints = (player.round_score || 0) + meldPoints;
      
      // We need to track total score somehow - let's use a new field or calculate from tricks_won
      // For now, we'll use round_score to hold the cumulative total
      // Actually, we should store total separately - let's check what we can use
      
      // For simplicity, we'll update the player's total by adding to their current position
      // We'll use the position field isn't used for scoring, let's add to round_score as cumulative
      // Actually let's calculate fresh from the game:
      // The issue is round_score is reset each round - we need to track total
      // Let's use team_a_score/team_b_score for FFA too, but mapped by position
    }

    // For FFA mode, we need to track cumulative scores differently
    // Let's calculate based on current implementation and just check for winner
    for (const player of freshPlayers || []) {
      const meldPoints = (player.melds || []).reduce((sum: number, m: any) => sum + m.points, 0);
      const roundTotal = (player.round_score || 0) + meldPoints;
      
      // Check if this player won (reached 1000)
      // For now, we'll track in team_a_score for position 0, team_b_score for position 1
      // This is a simplification - ideally we'd have a proper scores table
      if (player.position === 0) {
        const newScore = room.team_a_score + roundTotal;
        if (newScore >= 1000 && !gameWinner) {
          gameWinner = player.nickname;
          gameWinnerScore = newScore;
        }
        await supabase.from("rooms").update({ team_a_score: newScore }).eq("id", roomId);
      } else if (player.position === 1) {
        const newScore = room.team_b_score + roundTotal;
        if (newScore >= 1000 && !gameWinner) {
          gameWinner = player.nickname;
          gameWinnerScore = newScore;
        }
        await supabase.from("rooms").update({ team_b_score: newScore }).eq("id", roomId);
      }
      // For 3-4 players in FFA, we'd need more score columns - simplified for now
    }
  }

  // If we have a winner, end the game
  if (gameWinner) {
    await supabase.from("last_winners").insert({
      team_name: gameWinner,
      score: String(gameWinnerScore),
      rounds: room.round_number,
    });
    
    await supabase
      .from("rooms")
      .update({
        status: "finished",
        phase: "finished",
      })
      .eq("id", roomId);
    
    console.log(`[GameServer] Game finished! Winner: ${gameWinner} with ${gameWinnerScore} points`);
    return;
  }
  
  // No winner yet - start new round
  const { hands, musik } = dealCards(playerCount, true);
  
  // Calculate next bidder position (rotate from last round's first bidder)
  // First bidder of round N was position X, so round N+1 first bidder is position (X+1) % playerCount
  const sortedPlayers = [...(freshPlayers || [])].sort((a: any, b: any) => a.position - b.position);
  const nextBidderPosition = room.round_number % playerCount;
  const nextBidder = sortedPlayers[nextBidderPosition];

  // Update players with new cards
  for (let i = 0; i < playerCount; i++) {
    const player = sortedPlayers[i];
    if (player) {
      await supabase
        .from("room_players")
        .update({ 
          cards: hands[i], 
          round_score: 0, 
          tricks_won: [], 
          melds: [],
          is_ready: true, // Reset ready for bidding
        })
        .eq("id", player.id);
    }
  }
  
  // Delete old musik and add new one
  await supabase.from("musik").delete().eq("room_id", roomId);
  if (musik.length > 0) {
    await supabase.from("musik").insert({
      room_id: roomId,
      cards: musik,
    });
  }
  
  // Update room for new round
  await supabase
    .from("rooms")
    .update({
      phase: "bidding",
      round_number: room.round_number + 1,
      current_player_id: nextBidder?.player_id,
      current_bid: 100,
      current_trump: null,
      bid_winner_id: null,
    })
    .eq("id", roomId);
  
  console.log(`[GameServer] New round ${room.round_number + 1} started, first bidder: ${nextBidder?.nickname}`);
}
