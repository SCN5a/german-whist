"use strict";
/* German Whist — pure game logic, no DOM. Exposed as globalThis.GW so the
   same block runs under Node for the test suite. */
globalThis.GW = (() => {
  const SUITS = ["S", "H", "D", "C"];

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const suitOf = (c) => c[0];
  const rankOf = (c) => parseInt(c.slice(1), 10);
  const other = (p) => (p === "A" ? "B" : "A");

  function newDeck() {
    const d = [];
    for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push(s + r);
    return d;
  }

  function shuffled(deck, rand) {
    const d = deck.slice();
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [d[i], d[j]] = [d[j], d[i]];
    }
    return d;
  }

  function newGame(seed, firstLeader) {
    const rand = mulberry32(seed);
    const deck = shuffled(newDeck(), rand);
    const leader = firstLeader === "B" ? "B" : "A";
    return {
      seed,
      trump: suitOf(deck[26]),
      hands: { A: deck.slice(0, 13), B: deck.slice(13, 26) },
      stock: deck.slice(26),      // stock[0] is the face-up card
      leader,
      turn: leader,
      trick: { A: null, B: null },
      trickNum: 1,                // 1..26
      taken: { p1: { A: 0, B: 0 }, p2: { A: 0, B: 0 } },
      lastTrick: null,
      justDrawn: { A: null, B: null },
      winner: null,
    };
  }

  const upcard = (s) => (s.stock.length > 0 ? s.stock[0] : null);
  const phase = (s) => (s.stock.length > 0 ? 1 : 2);

  function legalCards(state, player) {
    if (state.winner || state.turn !== player) return [];
    const hand = state.hands[player];
    if (player === state.leader) return hand.slice();
    const leadCard = state.trick[state.leader];
    if (leadCard === null) return [];
    const follow = hand.filter((c) => suitOf(c) === suitOf(leadCard));
    return follow.length ? follow : hand.slice();
  }

  function trickWinner(leader, leadCard, followCard, trump) {
    const follower = other(leader);
    const ls = suitOf(leadCard);
    const fs = suitOf(followCard);
    if (ls === fs) return rankOf(followCard) > rankOf(leadCard) ? follower : leader;
    if (fs === trump) return follower;
    return leader;
  }

  /* Mutates state. Returns {resolved:false} after the lead card, or
     {resolved:true, trick} once both cards are down and the trick settled. */
  function playCard(state, player, card) {
    if (state.winner) throw new Error("game over");
    if (state.turn !== player) throw new Error("not this player's turn");
    if (!legalCards(state, player).includes(card)) throw new Error("illegal card: " + card);

    state.hands[player] = state.hands[player].filter((c) => c !== card);
    state.trick[player] = card;

    const opp = other(player);
    if (state.trick[opp] === null) {
      state.turn = opp;
      return { resolved: false };
    }

    const leadCard = state.trick[state.leader];
    const followCard = state.trick[other(state.leader)];
    const w = trickWinner(state.leader, leadCard, followCard, state.trump);
    const l = other(w);
    const ph = phase(state);
    state.taken[ph === 1 ? "p1" : "p2"][w]++;

    let drawnUp = null;
    state.justDrawn = { A: null, B: null };
    if (ph === 1) {
      drawnUp = state.stock.shift();
      state.hands[w].push(drawnUp);
      const hidden = state.stock.shift();
      state.hands[l].push(hidden);
      state.justDrawn[w] = drawnUp;
      state.justDrawn[l] = hidden;
    }

    state.lastTrick = {
      num: state.trickNum,
      phase: ph,
      leader: state.leader,
      cards: { A: state.trick.A, B: state.trick.B },
      winner: w,
      drawnUp,
    };
    state.trick = { A: null, B: null };
    state.trickNum++;
    state.leader = w;
    state.turn = w;

    if (state.hands.A.length === 0 && state.hands.B.length === 0) {
      state.winner = state.taken.p2.A > state.taken.p2.B ? "A" : "B";
      state.turn = null;
    }
    return { resolved: true, trick: state.lastTrick };
  }

  /* Trump suit first, then the remaining suits in a fixed order; ranks high→low. */
  function sortHand(hand, trump) {
    const order = [trump, ...["S", "H", "C", "D"].filter((s) => s !== trump)];
    return hand.slice().sort((a, b) => {
      const sa = order.indexOf(suitOf(a));
      const sb = order.indexOf(suitOf(b));
      if (sa !== sb) return sa - sb;
      return rankOf(b) - rankOf(a);
    });
  }

  return {
    SUITS, mulberry32, suitOf, rankOf, other,
    newDeck, newGame, upcard, phase,
    legalCards, trickWinner, playCard, sortHand,
  };
})();
