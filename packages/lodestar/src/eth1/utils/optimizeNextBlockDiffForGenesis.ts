/**
 * Utility for fetching genesis min genesis time block
 * Returns an approximation of the next block diff to fetch to progressively
 * get closer to the block that satisfies min genesis time condition
 */
export function optimizeNextBlockDiffForGenesis(
  lastFetchedBlock: {timestamp: number},
  params: {
    MIN_GENESIS_TIME: number;
    GENESIS_DELAY: number;
    SECONDS_PER_ETH1_BLOCK: number;
  }
): number {
  const timeToGenesis = params.MIN_GENESIS_TIME - params.GENESIS_DELAY - lastFetchedBlock.timestamp;
  const numBlocksToGenesis = Math.floor(timeToGenesis / params.SECONDS_PER_ETH1_BLOCK);
  if (numBlocksToGenesis <= 2) {
    return 1;
  } else {
    return Math.max(1, Math.floor(numBlocksToGenesis / 2));
  }
}
