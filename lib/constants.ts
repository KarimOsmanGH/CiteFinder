// Centralized constants for CiteFinder

// Text processing limits
export const MAX_TEXT_LENGTH = 8000
export const MAX_STATEMENT_CANDIDATES = 60
export const CONTEXT_RADIUS = 200
export const MIN_STATEMENT_LENGTH = 20
export const MAX_STATEMENT_LENGTH = 500
export const MIN_WORD_COUNT = 4

// API timeouts (in milliseconds)
export const API_TIMEOUT = {
  ARXIV: 10000,
  OPENALEX: 12000,
  CROSSREF: 12000,
  PUBMED: 10000,
  DEFAULT: 10000,
  SEARCH_BATCH: 8000,
  SEARCH_RELATED: 9000,
} as const

// API result limits
export const API_RESULT_LIMITS = {
  ARXIV: 8,
  OPENALEX: 10,
  CROSSREF: 8,
  PUBMED: 5,
  MAX_PAPERS_TOTAL: 8,
  MAX_PAPERS_PER_CITATION: 6,
} as const

// Similarity thresholds
export const SIMILARITY_THRESHOLDS = {
  MIN_DISPLAY: 50,        // Minimum similarity to display to users
  MIN_SEMANTIC: 0.2,      // Minimum semantic similarity
  MIN_TERM_MATCHES: 2,    // Minimum term matches for relevance
  HIGH_QUALITY: 35,       // High quality match threshold
  ACCEPTABLE: 25,         // Acceptable match threshold
  MIN_COMBINED: 15,       // Minimum combined score
} as const

// Confidence score modifiers
export const CONFIDENCE = {
  BASE: 0.5,
  WITH_YEAR: 0.2,
  WITH_AUTHORS: 0.2,
  WITH_TITLE: 0.1,
  SEMANTIC_BASE: 0.55,
  SEMANTIC_MULTIPLIER: 0.4,
  OVERLAP_BASE: 0.5,
  OVERLAP_MULTIPLIER: 0.25,
  MIN: 0.5,
  MAX: 0.95,
} as const

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE_MB: 50,
  MAX_SIZE_BYTES: 50 * 1024 * 1024,
} as const

// Stop words for text processing
export const STOP_WORDS = [
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 
  'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 
  'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 
  'me', 'him', 'her', 'us', 'them', 'who', 'what', 'when', 'where', 'why', 'how', 
  'which', 'than', 'more', 'most', 'some', 'any', 'many', 'much', 'such', 'very', 
  'also', 'just', 'only', 'even', 'still', 'yet', 'now', 'then', 'here', 'there',
  'using', 'used', 'based', 'through', 'during', 'between', 'various', 'different',
  'several', 'make', 'made', 'show', 'shows', 'shown', 'find', 'finds', 'found', 
  'use', 'uses', 'provide', 'provides', 'improve', 'improves', 'improved', 
  'enhance', 'enhances', 'enhanced', 'include', 'includes', 'into', 'over', 
  'after', 'before', 'under', 'while'
] as const

// Priority academic terms regex pattern
export const PRIORITY_TERMS_PATTERN = /\b(?:algorithm|analysis|approach|assessment|data|development|evaluation|experiment|framework|implementation|investigation|method|methodology|model|optimization|performance|procedure|process|research|results|study|system|technique|technology|test|validation|drone|uav|remote sensing|earth observation|satellite|aerial|imaging|spectral|monitoring|detection|mapping|survey|geospatial|software|open source|platform|application|solution|architecture|database|processing|accuracy|precision|effectiveness|efficiency|significant|correlation|improvement|enhancement|quality|reliability|propose|present|demonstrate|evaluate|assess|examine|investigate|analyze|measure|calculate|determine|establish|prove|validate|conclude|outcomes|findings|implications|impact|benefits|advantages|limitations|challenges|potential)\b/gi

// Important academic phrases to preserve
export const IMPORTANT_PHRASES = [
  'machine learning', 'deep learning', 'neural network', 'computer vision',
  'natural language processing', 'remote sensing', 'climate change',
  'environmental monitoring', 'data analysis', 'artificial intelligence',
  'quantum computing', 'blockchain technology', 'renewable energy',
  'gene editing', 'stem cells', 'clinical trial', 'randomized controlled'
] as const
