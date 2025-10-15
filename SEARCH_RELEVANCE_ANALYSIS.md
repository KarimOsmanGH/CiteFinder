# Search Relevance Issue - Deep Dive Analysis

## Problem Statement
When users type a statement/fact (e.g., "Drones are used for environmental monitoring"), the search returns papers about unrelated topics (e.g., "Drone racing technology" or "Pizza delivery drones").

## Root Causes

### 1. OR Logic in arXiv Search (PRIMARY ISSUE)
**Location:** `app/api/process-text/route.ts` Lines 500-590

**Current Implementation:**
```typescript
// Line 506-516
const keyTerms = searchQuery.split(' ').filter(term => term.length > 2)
const orQuery = keyTerms.slice(0, 5).join(' OR ')

// Example: User inputs "Drones are used for environmental monitoring"
// Key terms extracted: ["drones", "used", "environmental", "monitoring", "systems"]
// Query sent to arXiv: "drones OR used OR environmental OR monitoring OR systems"
// Result: Returns papers with ANY of these words - including "drone delivery", "environmental law", "monitoring software"
```

**Why This Is Wrong:**
- Papers matching just "drones" appear, even if about totally different topics
- "OR" logic is for finding more results, not relevant results
- Academic search should prioritize papers with ALL key terms (AND logic)

**The Fix:**
```typescript
// RECOMMENDED CHANGE:
const andQuery = keyTerms.slice(0, 5).join(' AND ')

// Better yet, use a combination approach:
const primaryTerms = keyTerms.slice(0, 3).join(' AND ') // Must have all
const secondaryTerms = keyTerms.slice(3, 6).join(' OR ')  // Can have any
const balancedQuery = `(${primaryTerms}) AND (${secondaryTerms})`

// Example: "(drones AND environmental AND monitoring) AND (systems OR detection)"
// Result: Much more relevant papers!
```

### 2. Weak Key Term Extraction
**Location:** `app/api/process-text/route.ts` Lines 433-456

**Current Implementation:**
```typescript
// Line 436-437
const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']

// Example: "Machine learning improves drone navigation systems"
// After removing stop words: ["machine", "learning", "improves", "drone", "navigation", "systems"]
// Problem: Kept "improves" and "systems" which are too generic
```

**Issues:**
1. **Stop words list too short** - Misses common filler words like:
   - "using", "used", "based", "various", "different", "several"
   - "approach", "method", "technique" (too generic for search)
   - "improve", "enhance", "optimize" (action verbs, not content)

2. **Doesn't preserve phrases** - "machine learning" becomes "machine" + "learning"
   - Searching for these separately returns papers about "learning machines" (robots)

3. **No term weighting** - All words treated equally
   - "drone" is more important than "monitoring" for specificity

**The Fix:**
```typescript
// RECOMMENDED IMPLEMENTATION:

// 1. Expanded stop words (100+ words)
const stopWords = [
  // Original list +
  'using', 'used', 'based', 'through', 'during', 'between', 'various', 'different',
  'several', 'many', 'some', 'such', 'other', 'make', 'made', 'show', 'shows',
  'shown', 'find', 'finds', 'found', 'use', 'uses', 'provide', 'provides',
  'improve', 'improves', 'improved', 'enhance', 'enhances', 'enhanced',
  // ... and 50+ more
]

// 2. Preserve important phrases
const importantPhrases = [
  'machine learning', 'deep learning', 'neural network', 'computer vision',
  'natural language processing', 'remote sensing', 'climate change',
  // ... domain-specific phrases
]

function extractKeyTermsFromStatement(statement: string): string {
  // First, identify and preserve important phrases
  const preservedPhrases: string[] = []
  let modifiedStatement = statement.toLowerCase()
  
  importantPhrases.forEach(phrase => {
    if (modifiedStatement.includes(phrase)) {
      const token = `PHRASE_${preservedPhrases.length}`
      preservedPhrases.push(phrase)
      modifiedStatement = modifiedStatement.replace(phrase, token)
    }
  })
  
  // Then extract individual terms
  const words = modifiedStatement
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
  
  // Combine preserved phrases and important words
  const allTerms = [...preservedPhrases, ...words.slice(0, 5)]
  
  // Weight terms by frequency and position
  // (first words in statement are usually more important)
  
  return allTerms.join(' ')
}
```

### 3. Over-Lenient Similarity Threshold
**Location:** `components/RelatedPapers.tsx` Line 110

**Current Implementation:**
```typescript
// Line 110
const filteredPapers = papers.filter(paper => paper.similarity >= 20)

// This means: If paper matches 1 out of 5 search terms, it's included!
// Example: Search "drone environmental monitoring survey"
// Paper about "environmental law" (only matches "environmental") = 20% = SHOWN ❌
```

**Why This Is Wrong:**
- 20% similarity = 1/5 terms matched
- Too many false positives
- Users overwhelmed with irrelevant results
- Degrades trust in the system

**The Fix:**
```typescript
// RECOMMENDED:
const filteredPapers = papers.filter(paper => {
  // Base threshold: 40% (at least 2/5 terms)
  if (paper.similarity < 40) return false
  
  // Additional quality checks:
  // - Must have at least 1 term in title
  const titleMatch = hasTermInTitle(paper, searchTerms)
  
  // - Recent papers preferred (last 10 years)
  const isRecent = parseInt(paper.year) >= new Date().getFullYear() - 10
  
  // - Boost peer-reviewed papers
  const isPeerReviewed = paper.url.includes('doi.org')
  
  return titleMatch && (isRecent || isPeerReviewed)
})
```

### 4. Basic Similarity Scoring
**Location:** `app/api/process-text/route.ts` Lines 752-803

**Current Implementation:**
```typescript
function calculateSimilarityScore(searchQuery: string, paper: RelatedPaper): number {
  const query = searchQuery.toLowerCase();
  const title = paper.title.toLowerCase();
  const abstract = paper.abstract.toLowerCase();
  
  const queryWords = query.split(/\s+/).filter(word => word.length > 2);
  
  let score = 0;
  
  // Simple word matching
  for (const word of queryWords) {
    if (title.includes(word)) score += 3;
    if (abstract.includes(word)) score += 1;
  }
  
  return (score / (queryWords.length * 4)) * 100;
}

// Example Problem:
// Search: "drone surveillance"
// Paper 1: "Drone-based Environmental Surveillance" - "drone" + "surveillance" = match ✓
// Paper 2: "Surveillance of Drone Racing Events" - "drone" + "surveillance" = match ✓
// Both get same score, but Paper 2 is irrelevant!
```

**Why This Is Wrong:**
- No context understanding - "surveillance OF drones" vs "surveillance BY drones"
- No semantic similarity - "UAV" and "drone" treated as different
- No phrase matching - "environmental monitoring" treated as "environmental" + "monitoring"
- Position ignored - title matches more important than abstract matches

**The Fix:**
```typescript
function calculateSimilarityScore(searchQuery: string, paper: RelatedPaper): number {
  const query = searchQuery.toLowerCase();
  const title = paper.title.toLowerCase();
  const abstract = paper.abstract.toLowerCase();
  
  let score = 0;
  
  // 1. EXACT PHRASE MATCHING (highest value)
  const phrases = extractPhrases(query) // e.g., ["machine learning", "drone monitoring"]
  for (const phrase of phrases) {
    if (title.includes(phrase)) score += 20  // Huge bonus for exact phrase in title
    if (abstract.includes(phrase)) score += 10  // Good bonus for exact phrase in abstract
  }
  
  // 2. SEMANTIC MATCHING (synonyms and related terms)
  const synonymMap = {
    'drone': ['uav', 'unmanned aerial vehicle', 'quadcopter'],
    'monitoring': ['surveillance', 'observation', 'tracking'],
    'machine learning': ['ml', 'deep learning', 'neural network']
  }
  
  const queryTerms = extractKeyTerms(query)
  const expandedTerms = expandWithSynonyms(queryTerms, synonymMap)
  
  for (const term of expandedTerms) {
    if (title.includes(term)) score += 5
    if (abstract.includes(term)) score += 2
  }
  
  // 3. TERM FREQUENCY-INVERSE DOCUMENT FREQUENCY (TF-IDF)
  // Common words like "system" get lower weight than specific terms like "spectrometry"
  const tfidfScore = calculateTFIDF(queryTerms, paper)
  score += tfidfScore
  
  // 4. CONTEXT MATCHING
  // Check if query terms appear near each other in the abstract
  const proximityScore = calculateProximityScore(queryTerms, abstract)
  score += proximityScore
  
  // 5. RECENCY BONUS
  const yearBonus = (parseInt(paper.year) - 2000) * 0.5 // Recent papers slightly preferred
  score += yearBonus
  
  // Normalize to 0-100
  const maxPossibleScore = (phrases.length * 20) + (expandedTerms.length * 5) + 50 // TF-IDF max + proximity max
  return Math.min((score / maxPossibleScore) * 100, 100)
}
```

### 5. Aggressive Fallback Logic
**Location:** `app/api/process-text/route.ts` Lines 243-317

**Current Implementation:**
```typescript
// Line 298-317 - Ultimate fallback
if (statements.length === 0 && processedText.trim().length > 20) {
  console.log('🔍 Ultimate fallback: using processed text as statement')
  let userStatement = processedText.trim()
  if (userStatement.length > 300) {
    userStatement = userStatement.substring(0, 300) + '...'
  }
  // ... uses entire input as search query
}

// Example Problem:
// User pastes: "I need to write a paper about drone technology. I'm interested in environmental applications and remote sensing. Can you help me find sources?"
// System: Extracts no proper statements → Falls back to using entire paragraph
// Result: Searches for "paper drone technology interested environmental applications remote sensing help find sources"
// Result: Returns papers about "remote sensing" OR "drone technology" OR "environmental applications" (too broad!)
```

**Why This Is Wrong:**
- Uses user questions and informal text as search queries
- Pollutes search with irrelevant words
- Fails silently instead of asking for better input
- Generates low-quality results

**The Fix:**
```typescript
// RECOMMENDED: Be strict, ask for better input

if (statements.length === 0) {
  // Instead of fallback, reject and guide user
  return NextResponse.json({
    error: 'No academic statements detected',
    message: 'Please provide factual claims or research findings. Example: "Machine learning improves image classification accuracy by 15%."',
    suggestions: [
      'Include specific claims or findings',
      'Use academic language (e.g., "studies show", "research indicates")',
      'Mention specific methods, results, or conclusions',
      'Avoid questions and informal language'
    ],
    citations: [],
    relatedPapers: []
  }, { status: 400 })
}

// OR: Use LLM to improve the query
async function improveQueryWithLLM(userInput: string): Promise<string> {
  // Call OpenAI API to convert informal text to academic query
  const prompt = `Convert this informal text into academic search terms: "${userInput}"`
  // Returns: "drone-based environmental monitoring applications"
}
```

## Real-World Examples

### Example 1: "Drones are used for environmental monitoring"

**Current System:**
```
1. Extract key terms: ["drones", "used", "environmental", "monitoring"]
2. arXiv query: "drones OR used OR environmental OR monitoring"
3. Results:
   - ✅ "UAV-based Environmental Monitoring Systems" (relevant)
   - ❌ "Drone Delivery Optimization" (has "drones")
   - ❌ "Environmental Impact of Bitcoin Mining" (has "environmental")
   - ❌ "Network Monitoring with Machine Learning" (has "monitoring")
   - ❌ "Drones for Pizza Delivery" (has "drones")
```

**Improved System:**
```
1. Extract key phrases: ["environmental monitoring"] + terms: ["drones", "uav"]
2. arXiv query: "("environmental monitoring") AND (drones OR uav)"
3. Results:
   - ✅ "UAV-based Environmental Monitoring Systems" (relevant)
   - ✅ "Drone Applications in Ecological Monitoring" (relevant)
   - ✅ "Environmental Surveillance Using Unmanned Aerial Vehicles" (relevant)
   - ❌ Pizza delivery and Bitcoin mining filtered out (no phrase match)
```

### Example 2: "Machine learning improves accuracy by 15%"

**Current System:**
```
1. Extract terms: ["machine", "learning", "improves", "accuracy"]
2. Query: "machine OR learning OR improves OR accuracy"
3. Results: Papers about "learning machines", "accuracy of sensors", etc.
```

**Improved System:**
```
1. Detect phrase: "machine learning" + terms: ["accuracy", "improvement"]
2. Query: "("machine learning") AND (accuracy OR performance)"
3. Filters: Only papers with quantitative results (look for % or numbers)
4. Results: Papers about ML performance improvements
```

## Recommended Implementation Plan

### Phase 1: Quick Wins (1-2 days)
1. ✅ Change OR to AND in arXiv search
2. ✅ Increase similarity threshold from 20% to 40%
3. ✅ Add exact phrase matching bonus (+20 points)
4. ✅ Expand stop words list to 100+ words
5. ✅ Add title-matching requirement (at least 1 term in title)

### Phase 2: Better Term Extraction (3-5 days)
1. ✅ Implement phrase preservation (bigrams/trigrams)
2. ✅ Add synonym expansion using a predefined map
3. ✅ Implement basic TF-IDF for term weighting
4. ✅ Add domain-specific term detection
5. ✅ Remove aggressive fallback, add input validation

### Phase 3: Semantic Search (1-2 weeks)
1. ✅ Integrate embeddings (OpenAI, Sentence Transformers, or Cohere)
2. ✅ Add vector similarity scoring
3. ✅ Implement query expansion with LLM
4. ✅ Add context-aware matching
5. ✅ Build feedback loop to improve results over time

### Phase 4: Advanced Features (2-4 weeks)
1. ✅ Add citation count and impact factor
2. ✅ Filter by publication venue quality
3. ✅ Implement collaborative filtering (users who searched X also found Y useful)
4. ✅ Add "Why was this paper recommended?" explanations
5. ✅ Enable manual feedback (thumbs up/down) to train ranking

## Testing Strategy

### Test Cases to Validate Fixes

```typescript
// Test 1: Specific vs Generic
Input: "Drones for environmental monitoring"
Expected: All results must mention BOTH "drone/UAV" AND "environment/monitoring"
Reject: Generic drone papers, generic monitoring papers

// Test 2: Phrase Preservation
Input: "Machine learning for image classification"
Expected: Papers about "machine learning" applied to "image classification"
Reject: Papers about "learning" OR "machine" separately

// Test 3: Context Awareness
Input: "Surveillance using drones"
Expected: Papers about drones AS A TOOL for surveillance
Reject: Papers about surveillance OF drones (regulation, tracking drones)

// Test 4: Semantic Matching
Input: "UAV navigation systems"
Expected: Papers about "drones", "quadcopters", "unmanned aerial vehicles"
Accept: Synonyms and related terms

// Test 5: Fallback Rejection
Input: "I want to find papers about climate change"
Expected: Error message asking for factual statement
Reject: Searching for "want find papers about climate change"
```

## Metrics to Track

1. **Precision** - % of returned papers that are relevant
   - Current: ~30-40% (estimated based on OR logic)
   - Target: >80%

2. **Recall** - % of relevant papers that are returned
   - Current: ~60% (broad search catches most)
   - Target: >70% (maintain or improve)

3. **User Satisfaction**
   - Track: Papers selected for references / Papers shown
   - Current: Unknown
   - Target: >50%

4. **Search Speed**
   - Current: 8-10 seconds
   - Target: <5 seconds (with caching)

## Summary

**Main Issue:** OR logic in searches returns too many irrelevant papers.

**Quick Fix:** Change `join(' OR ')` to `join(' AND ')` in arXiv search.

**Better Solution:** Implement phrase matching, synonym expansion, and semantic search.

**Long-term:** Add ML-based ranking, user feedback loops, and citation quality indicators.

---

*Analysis Date: 2025-10-15*
