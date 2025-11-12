# API Performance Optimization Plan

**Date**: 2025-11-12
**Status**: Pending Implementation
**Expected Impact**: 5-10x faster API response times

---

## 🔴 Critical Performance Issues Identified

### 1. `/api/regions/[regionCode]` - External API Call with NO Caching

**Current Implementation**: `app/api/regions/[regionCode]/route.ts:13`

```typescript
// Fetch all regions from eSIM API
const regions = await listSupportedRegions();
```

**Problem**:
- Calls eSIM Access external API **every single time**
- No caching mechanism
- Subject to rate limiting (8 requests/second)

**Impact**:
- 1-3 second delay per request
- Unnecessary load on external API
- Poor user experience

**Solution**:
- Add in-memory cache with 15-30 minute TTL
- Regions data changes rarely, perfect candidate for caching
- Fallback to Supabase if external API fails

**Expected Improvement**: 1-3s → 10-50ms (20-100x faster)

---

### 2. `/api/plans` - Returns ALL Plans at Once (1,807 records)

**Current Implementation**: `app/api/plans/route.ts:16-61`

```typescript
while (true) {
  let query = supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .gte('data_gb', 0.5)
    .order('retail_price', { ascending: true })
    .range(from, from + pageSize - 1);
  // ... fetches ALL plans
}
```

**Problem**:
- Fetches all 1,807 active plans in one go
- Large JSON payload (~200-500KB)
- Slow to transfer and parse on client side
- No pagination for frontend

**Impact**:
- 2-4 second load time
- High bandwidth usage (especially on mobile)
- Slow initial page load

**Solutions**:

**Option A**: Add pagination
- Return 50-100 plans per page
- Implement cursor-based or offset pagination
- Frontend loads more as user scrolls

**Option B**: Add response compression
- Enable gzip/brotli compression
- Reduces payload size by 60-80%
- Minimal code change

**Option C**: Client-side caching (already implemented)
- ✅ Plans page already has localStorage cache (5 min)
- ✅ Destinations page needs same caching

**Expected Improvement**: 2-4s → 300-800ms (3-5x faster)

---

### 3. `/api/currency/detect` - No Caching

**Current Implementation**: `app/api/currency/detect/route.ts`

**Problem**:
- Called 2-3 times per page load (GET + POST)
- No cache headers
- Browser re-fetches every time
- POST endpoint converts all prices at once

**Impact**:
- 200-500ms per page load
- Repeated work for same data
- Unnecessary server load

**Solutions**:
1. Add Cache-Control headers to GET endpoint
   - `Cache-Control: public, max-age=3600` (1 hour)
   - Currency detection rarely changes per session

2. Batch price conversion more efficiently
   - Only convert prices that are visible
   - Lazy load price conversions

**Expected Improvement**: 200-500ms → 10-50ms (5-10x faster)

---

### 4. Cache Headers Missing on Most APIs

**Current State**: Only 2 out of 44 API endpoints have caching

**Endpoints with caching**:
- ✅ `/api/plans` - 5 minutes (`s-maxage=300`)
- ✅ `/api/qr/[orderId]` - 5 minutes (private)

**Endpoints that SHOULD have caching**:
- `/api/regions/[regionCode]` - 30 minutes (regions don't change often)
- `/api/currency/detect` GET - 1 hour (currency detection per session)
- `/api/plans/[planId]` - 5 minutes (plan details)
- `/api/health` - 1 minute (health check)

**Impact**:
- Browsers can't cache responses
- Repeated identical requests
- Higher server load

**Solution**:
Add appropriate Cache-Control headers to read-only endpoints

```typescript
// For relatively static data
response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');

// For user-specific data
response.headers.set('Cache-Control', 'private, max-age=300');
```

**Expected Improvement**: 30-50% reduction in API calls

---

### 5. Large Data Fetching Without Optimization

**Problem**:
- Database has excellent indexes ✅
- But queries still load too much data
- No lazy loading or virtual scrolling

**Examples**:
- Plans page loads all 1,807 plans upfront
- Destinations page loads all plans
- No infinite scroll or pagination

**Solutions**:
1. Implement virtual scrolling for large lists
2. Add pagination to API endpoints
3. Load data on-demand as user scrolls
4. Use query parameters for filtering at DB level

---

## 📊 Performance Impact Analysis

### Current Performance

**Plans Page Load Time**:
```
/plans page load:
├── /api/plans (2-4s)          - 1807 plans, ~300KB JSON
├── /api/currency/detect GET (200ms)
├── /api/currency/detect POST (300ms) - converts all 1807 prices
└── Total: ~3-5 seconds
```

**Destinations Page Load Time**:
```
/destinations page load:
├── /api/plans (2-4s)          - 1807 plans
├── /api/currency/detect GET (200ms)
├── /api/currency/detect POST (300ms)
└── Total: ~3-5 seconds
```

**Region Info Page**:
```
/api/regions/[code]:
├── listSupportedRegions() (1-3s) - External API call
└── Total: 1-3 seconds
```

---

### After Optimization

**Plans Page Load Time**:
```
/plans page load (first visit):
├── /api/plans (800ms)         - compressed response
├── /api/currency/detect (50ms) - cached
└── Total: ~850ms ⚡ (4-6x faster)

/plans page load (return visit):
├── /api/plans (cached, instant)
├── /api/currency/detect (cached, instant)
└── Total: ~50-100ms ⚡ (30-50x faster)
```

**Destinations Page Load Time**:
```
/destinations page load:
├── /api/plans (100ms)         - cached + compressed
├── /api/currency/detect (cached)
└── Total: ~150ms ⚡ (20-30x faster)
```

**Region Info Page**:
```
/api/regions/[code]:
├── In-memory cache hit (10ms)
└── Total: ~10-20ms ⚡ (100x faster)
```

---

## 🔧 Implementation Plan

### Phase 1: Quick Wins (1-2 hours)

1. **Add Cache-Control headers** to read-only endpoints
   - `/api/regions/[regionCode]` - 30 min
   - `/api/currency/detect` GET - 1 hour
   - `/api/plans/[planId]` - 5 min

2. **Enable response compression** (Next.js config)
   - Add gzip/brotli compression
   - Reduces payload by 60-80%

3. **Add destinations page caching** (same as plans page)
   - localStorage cache with 5-min expiry

**Expected Impact**: 2-3x faster

---

### Phase 2: Caching Layer (2-4 hours)

1. **Add in-memory cache for regions**
   - Cache `listSupportedRegions()` response
   - 15-30 minute TTL
   - Fallback to Supabase

2. **Optimize currency detection**
   - Cache GET responses
   - Optimize POST batch conversion
   - Only convert visible prices

**Expected Impact**: 3-5x faster

---

### Phase 3: Data Loading Optimization (4-6 hours)

1. **Add pagination to plans API**
   - Cursor-based or offset pagination
   - Return 50-100 plans per page
   - Infinite scroll on frontend

2. **Implement virtual scrolling**
   - Only render visible items
   - Lazy load as user scrolls
   - Better performance for large lists

3. **Add filtering at database level**
   - Region filtering
   - Price range filtering
   - Data amount filtering

**Expected Impact**: 5-10x faster

---

### Phase 4: Advanced Optimization (Optional)

1. **Add CDN caching** (Vercel Edge)
   - Cache static API responses at edge
   - Even faster for global users

2. **Implement service worker** for offline support
   - Cache critical data locally
   - Instant page loads

3. **Add database query optimization**
   - Analyze slow queries
   - Add composite indexes if needed
   - Optimize join queries

**Expected Impact**: 10-20x faster

---

## 🎯 Priority Recommendations

### Must Do (High Impact, Low Effort)
1. ✅ Add Cache-Control headers to APIs
2. ✅ Enable response compression
3. ✅ Add in-memory cache for regions API
4. ✅ Add destinations page caching

### Should Do (High Impact, Medium Effort)
1. Add pagination to plans API
2. Optimize currency price conversion
3. Implement virtual scrolling

### Nice to Have (Medium Impact, High Effort)
1. CDN edge caching
2. Service worker implementation
3. Advanced query optimization

---

## 📝 Notes

- Database indexes are already excellent ✅
- Client-side caching partially implemented (plans page only) ✅
- Main bottleneck is large data transfer and lack of server-side caching
- External API calls (eSIM Access) need caching layer

---

## 🚀 Next Steps

1. Review and approve this plan
2. Implement Phase 1 (quick wins)
3. Test performance improvements
4. Proceed to Phase 2 if needed
5. Monitor and iterate

---

## 📈 Success Metrics

**Target Goals**:
- Plans page load: < 1 second (currently 3-5s)
- Destinations page load: < 1 second (currently 3-5s)
- Region info API: < 100ms (currently 1-3s)
- API cache hit rate: > 80%
- Bandwidth reduction: > 50%

**Monitoring**:
- Add performance timing logs
- Track API response times
- Monitor cache hit rates
- User experience feedback
