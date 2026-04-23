export interface PotdProblem {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  slug: string;
  /** One-liner hint shown on the card. */
  hint: string;
}

/**
 * Curated rotation of classic DSA problems. We cycle through by day-of-year so
 * a given date always shows the same "today's challenge" — deterministic and
 * keeps students unstuck when their pipeline is empty.
 *
 * Links resolve to leetcode.com/problems/:slug. These run inside the in-app
 * LeetCode webview via openInApp (LeetCode plugin handles the URL).
 */
export const POTD_POOL: PotdProblem[] = [
  {
    title: "Two Sum",
    difficulty: "Easy",
    topic: "Arrays / Hashing",
    slug: "two-sum",
    hint: "Use a hashmap of value → index for O(n) lookup.",
  },
  {
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: "Stack",
    slug: "valid-parentheses",
    hint: "Push opens, pop on close — mismatch means invalid.",
  },
  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "Easy",
    topic: "Arrays / DP",
    slug: "best-time-to-buy-and-sell-stock",
    hint: "Track min so far + max profit in a single pass.",
  },
  {
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    topic: "Linked List",
    slug: "merge-two-sorted-lists",
    hint: "Dummy head + splice smaller of two pointers.",
  },
  {
    title: "Invert Binary Tree",
    difficulty: "Easy",
    topic: "Tree / DFS",
    slug: "invert-binary-tree",
    hint: "Swap children and recurse — 3 lines, famously.",
  },
  {
    title: "Maximum Subarray",
    difficulty: "Medium",
    topic: "DP / Kadane",
    slug: "maximum-subarray",
    hint: "Kadane — reset running sum when it drops below 0.",
  },
  {
    title: "Group Anagrams",
    difficulty: "Medium",
    topic: "Hashing",
    slug: "group-anagrams",
    hint: "Sorted string (or 26-char count) is the key.",
  },
  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    topic: "Sliding Window",
    slug: "longest-substring-without-repeating-characters",
    hint: "Shrink from left when you hit a dup, expand right.",
  },
  {
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    topic: "Heap / Bucket",
    slug: "top-k-frequent-elements",
    hint: "Bucket sort by frequency beats a heap asymptotically.",
  },
  {
    title: "Product of Array Except Self",
    difficulty: "Medium",
    topic: "Prefix / Postfix",
    slug: "product-of-array-except-self",
    hint: "Two passes — prefix and postfix products, no division.",
  },
  {
    title: "Validate Binary Search Tree",
    difficulty: "Medium",
    topic: "Tree / DFS",
    slug: "validate-binary-search-tree",
    hint: "DFS with (low, high) bounds, not just parent compare.",
  },
  {
    title: "Number of Islands",
    difficulty: "Medium",
    topic: "Graph / BFS",
    slug: "number-of-islands",
    hint: "DFS/BFS from each '1', flip visited cells in place.",
  },
  {
    title: "Clone Graph",
    difficulty: "Medium",
    topic: "Graph",
    slug: "clone-graph",
    hint: "Hashmap old→new + DFS/BFS — classic hand-drawn recursion.",
  },
  {
    title: "Coin Change",
    difficulty: "Medium",
    topic: "DP",
    slug: "coin-change",
    hint: "Bottom-up DP; dp[i] = min(dp[i-c]+1) over coins c.",
  },
  {
    title: "Course Schedule",
    difficulty: "Medium",
    topic: "Graph / Topo Sort",
    slug: "course-schedule",
    hint: "Kahn's algorithm — detect cycle via leftover indegrees.",
  },
  {
    title: "LRU Cache",
    difficulty: "Medium",
    topic: "Design",
    slug: "lru-cache",
    hint: "HashMap + doubly-linked list. This one's a rite of passage.",
  },
  {
    title: "Word Break",
    difficulty: "Medium",
    topic: "DP",
    slug: "word-break",
    hint: "dp[i] true if any word ends at i and dp[i-len] is true.",
  },
  {
    title: "Binary Tree Level Order Traversal",
    difficulty: "Medium",
    topic: "Tree / BFS",
    slug: "binary-tree-level-order-traversal",
    hint: "BFS with level size snapshot before the inner loop.",
  },
  {
    title: "3Sum",
    difficulty: "Medium",
    topic: "Two Pointers",
    slug: "3sum",
    hint: "Sort, fix one, two-pointer the rest; skip dupes.",
  },
  {
    title: "Merge Intervals",
    difficulty: "Medium",
    topic: "Intervals",
    slug: "merge-intervals",
    hint: "Sort by start, extend end if overlap, else push new.",
  },
  {
    title: "Word Ladder",
    difficulty: "Hard",
    topic: "BFS",
    slug: "word-ladder",
    hint: "BFS over words; precompute pattern buckets for neighbors.",
  },
  {
    title: "Trapping Rain Water",
    difficulty: "Hard",
    topic: "Two Pointers",
    slug: "trapping-rain-water",
    hint: "Two pointers + running max from both sides.",
  },
  {
    title: "Serialize and Deserialize Binary Tree",
    difficulty: "Hard",
    topic: "Tree",
    slug: "serialize-and-deserialize-binary-tree",
    hint: "Preorder with null markers — simplest to debug.",
  },
];

export function potdForToday(): PotdProblem {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return POTD_POOL[dayOfYear % POTD_POOL.length];
}

export function potdUrl(problem: PotdProblem): string {
  return `https://leetcode.com/problems/${problem.slug}/`;
}
