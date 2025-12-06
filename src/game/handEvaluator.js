// --------- step 1 ---------
//BASE UTILITES


export const RANK_VALUES = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  "J": 11,
  "Q": 12,
  "K": 13,
  "A": 14,
};
// card to value
export function toValue(card) {
  return RANK_VALUES[card.rank];
}
//List all 21 possible combinations of player cards and community cards.
export function getCombinations(cards,k){
    const result = [];

    function backtrack(start,combo){
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }

        for(let i = start; i < cards.length; i++){
            combo.push(cards[i]);
            backtrack(i + 1, combo);
            combo.pop();
        }
    }

    backtrack(0, []);
    return result;
}
// track each rank appear times
export function countRanks(cards){
    const counts = {};
    for (const card of cards) {
        const v = toValue(card);
        counts[v] = (counts[v] || 0) + 1;
    }
    return counts;
}

//pending flush
export function isFlush(cards) {
  if (cards.length === 0) return false;
  const firstSuit = cards[0].suit;
  return cards.every(card => card.suit === firstSuit);
}

//pending straighthigh
export function getStraightHigh(values){
    if (values.length < 5) return null

    //Remove duplicates and sort from high to low
    const unique = [...new Set(values)].sort((a,b) => b - a);

    if (unique.length !== 5){
        //staighthigh must 5 different ranks
        return null
    }

    //special straighthigh
    const isA2345 =
        unique[0] === 14 &&
        unique[1] === 5 &&
        unique[2] === 4 &&
        unique[3] === 3 &&
        unique[4] === 2;

    if (isA2345) {
        return 5; // staighthigh largest length
    }


    //Normalstraight: highest - lowest = 4
    const isNormalStraight = unique[0] - unique[4] === 4;
    if(isNormalStraight){
        return unique[0]; //highest card
    }

    return null;
}

// Sort the cards from largest to smallest
export function sortCardsByValueDesc(cards) {
  return [...cards].sort((a, b) => toValue(b) - toValue(a));
}

//-------------- step2 -------------
// Evaluate five cards

//card category
export const HAND_CATEGORY = {
    0: "High Card",
    1: "One Pair",
    2: "Two Pair",
    3: "Three of a Kind",
    4: "Straight",
    5: "Flush",
    6: "Full House",
    7: "Four of a Kind",
    8: "Straight Flush",
}
/**
 * 评估 5 张牌的牌型
 * @param {Array} hand - 5 张牌 [{rank:"A",suit:"♠"}, ...]
 * @returns {{category:number, tiebreakers:number[]}}
 */

export function evaluate5CardHand(hand) {
    if (hand.length !== 5){
        throw new Error("evaluate5CardHand need 5 cards");
    }
    // sort the ranks
    const values = hand.map(toValue).sort((a, b) => b - a);
    // appear times
    const rankCounts = countRanks(hand);

    //put count to arrays then sort
    //from times large to less, then ranks high to low
    const valueCountPairs = Object.entries(rankCounts)
        .map(([v, cnt]) => ({value: Number(v), count: cnt }))
        .sort((a,b) => {
            if(b.count !== a.count) return b.count - a.count;//count large at front
            return b.value - a.value;                       // rank highest at front
        });

    const countsArray = valueCountPairs.map(p => p.count);

    //judge flush
    const flush = isFlush(hand);
    //judge straight
    const straightHigh = getStraightHigh(values);
    const straight = straightHigh !== null;

    // === 8: Straight Flush ===
    if(flush && straight) {
        return{
            category:8,
            tiebreakers:[straightHigh], //compar highest rank of straight
        };
    }

    // === 7: For of a Kind ==
    if(countsArray[0] === 4){
        const fourValue = valueCountPairs[0].value;
        const kicker = valueCountPairs[1].value;
        return{
            category:7,
            tiebreakers: [fourValue, kicker]
        };
        
    }
    // === 6: full house ===
    if (countsArray[0] === 3 && countsArray[1] === 2) {
        const triple = valueCountPairs[0].value;
        const pair = valueCountPairs[1].value;
        return {
            category: 6,
            tiebreakers: [triple, pair],
        };
    }

    // === 5: Flush ===
    if(flush) {
        const sortedValues = [...values].sort((a,b) => b-a);
        return{
            category: 5,
            tiebreakers: sortedValues,
        };
    }

    // === 4 :Straight === 
    if(straight) {
        return {
            category: 4,
            tiebreakers: [straightHigh],
        }
    }

    // === 3: Three of a Kind
    if (countsArray[0] === 3) {
        const triple = valueCountPairs[0].value;
        const kickers = valueCountPairs
        .slice(1) // single card for the rest
        .map(p => p.value)
        .sort((a, b) => b - a);
        return {
            category: 3,
            tiebreakers: [triple, ...kickers],
        };
    }

    // === 2: Two Pair ===
    if (countsArray[0] === 2 && countsArray[1] === 2){
        const highPair = Math.max(valueCountPairs[0].value,valueCountPairs[1].value)
        const lowPair = Math.min(valueCountPairs[0].value,valueCountPairs[1].value)
        const kicker = valueCountPairs[2].value;
        return{
            category: 2,
            tiebreakers: [highPair,lowPair,kicker],
        };
    }

    // === 1: One Pair ==
    if(countsArray[0] === 2){
        const pairValue = valueCountPairs[0].value;
        const kickers = valueCountPairs
            .slice(1) //rest 3 cards
            .map(p => p.value)
            .sort((a,b) => b - a);
        return {
            category: 1,
            tiebreakers: [pairValue, ...kickers],
        }
    }

    // === 0: High Card ==
    return{
        category:0,
        tiebreakers: [...values].sort((a,b) => b-a),
    };
}

// ----------- step 3 ---------
/**
 * Evaluate the final hand type of a player under the current public cards
* Select the strongest 5 cards from "Player 2's hand + Public cards (0 to 5 cards)"
 *
 * @param {Array} playerCards - The array of the player's hand cards, lengh 2 [{rank,suit}, {rank,suit}]
 * @param {Array} communityCards - The array of public cards,length 0 to 5.
 * @returns {{
 *   rank: number,          
 *   tiebreakers: number[], 
 *   best5Cards: Array      
 * }}
 */

export function evaluateHand(playerCards,communityCards){
    //1. commit all cards
    const allCard = [...playerCards,...communityCards];
    //make sure over five cards
    if(allCard.length < 5){
        const values = allCard.map(toValue).sort((a,b) => b-a);
        return{
            rank:0,
            tiebreakers:values,
            best5Cards: allCard,
        };
    }

    //2. if over five cards, list all combinations
    const combos = getCombinations(allCard,5);
    //save the informations of the best 5 cards
    let bestScore = null;
    let bestCombo = null;
    //3. find out the best combo
    for (const combo of combos){
        const score = evaluate5CardHand(combo);
        // if don't have a bestScore or there was score larger then bestscore, renew
        if(!bestScore || compareScore(score,bestScore) > 0){
            bestScore = score;
            bestCombo = combo;
        }
    }

    //4. return bestScore

    return{
        rank: bestScore.category,
        tiebreakers: bestScore.tiebreakers,
        best5Cards: bestCombo,
    }
}

//compare 2 combos
/**
 * Compare the scores of the two poker hands 
 *
 * @param {{category:number, tiebreakers:number[]}} a
 * @param {{category:number, tiebreakers:number[]}} b
 * @returns {number} 1 Indicates that a > b; -1 indicates that a < b; 0 indicates a draw.
 */

export function compareScore(a,b){
    //1.first compare category or rank
    const catA = a.category ?? a.rank;
    const catB = b.category ?? b.rank;

    if(catA !== catB){
        return catA > catB ? 1:-1;
    }

    //2. if category is the same,compare tiebreaker
    const len = Math.max(a.tiebreakers.length, b.tiebreakers.length);

    for (let i = 0; i < len; i++){
        const va = a.tiebreakers[i] ?? 0; //if not exist, return 0
        const vb = b.tiebreakers[i] ?? 0;

        if(va === vb) continue;

        return va > vb ? 1 : -1;
    }
    // all the same, means a tie
    return 0;
}
/**
 * Compare which of the two players wins when dealing with the same public cards.
 * It is convenient to use in the showdown stage.
 *
 * @param {Array} playerACards - player A's hand cards（2）
 * @param {Array} playerBCards - player B's hand cards（2）
 * @param {Array} communityCards - community cards（0~5）
 * @returns {number} 1 indicates that A wins, -1 indicates that B wins, and 0 indicates a tie.
 */
export function compareHands(playerACards, playerBCards, communityCards) {
  const resultA = evaluateHand(playerACards, communityCards);
  const resultB = evaluateHand(playerBCards, communityCards);

  return compareScore(resultA, resultB);
}
/**
 * Calculate the card strength of all players in the current public cards for one round, and determine the winner (allowing for multiple ties among players)
 *
 * @param {Array} players - player list：
 *        { id, name, cards: [{rank,suit},...], folded: boolean }
 * @param {Array} communityCards - communitycards array（0~5）
 *
 * @returns {{
 *   winners: Array,        
 *   bestResult: Object,    
 *   resultsByPlayerId: Map 
 * }}
 */
export function getWinners(players,communityCards) {
    // store each players result by Map
    const resultsByPlayerId = new Map();

    let bestResult = null //current best score
    let winners = [];       //current winners

    for(const player of players){
        //skip folded players
        if(player.folded){
            resultsByPlayerId.set(player.id,{
                player,
                result: null,
                folded: true,
            });
            continue;
        }
        

        // evaluate final cards
        const result = evaluateHand(player.cards, communityCards);

        resultsByPlayerId.set(player.id,{
            player,
            result,
            folded:false,
        });

        // renew bestresult & winner list
        if(!bestResult){
            //the first player 
            bestResult = result;
            winners = [player];
        }else{
            const cmp = compareScore(result, bestResult)

            if(cmp > 0){
                // current player > resident bestcards
                bestResult = result;
                winners = [player];
            }else if(cmp === 0) {
                //tie:put player into list
                winners.push(player);
            }
        }
    }
    return {
        winners,            
        bestResult,         
        resultsByPlayerId, 
    };


}