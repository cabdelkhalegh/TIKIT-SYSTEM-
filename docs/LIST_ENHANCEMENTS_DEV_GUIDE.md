# List Enhancements - Developer Guide

## Architecture Overview

The list enhancements are built using a modular architecture with reusable components and custom hooks that can be applied to any list page in the application.

## Component Structure

```
frontend/src/
├── components/ui/data-table/
│   ├── Pagination.tsx          # Pagination controls
│   ├── SearchInput.tsx         # Debounced search input
│   ├── FilterBar.tsx           # Active filter tags
│   ├── SortableHeader.tsx      # Sortable column header
│   └── index.ts                # Component exports
├── hooks/
│   └── useUrlState.ts          # URL state management hook
└── app/dashboard/
    ├── campaigns/page.tsx      # Enhanced campaigns list
    ├── influencers/page.tsx    # Enhanced influencers list
    └── collaborations/page.tsx # Enhanced collaborations list
```

## Core Components

### 1. Pagination Component

**File**: `/frontend/src/components/ui/data-table/Pagination.tsx`

**Props**:
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];  // Default: [10, 25, 50, 100]
  isLoading?: boolean;
}
```

**Features**:
- First, Previous, Next, Last navigation
- Page size selector with dropdown
- Item count display
- Responsive design (stacks on mobile)
- Disabled states for unavailable actions
- ARIA labels for accessibility

**Usage**:
```tsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  pageSize={pageSize}
  totalItems={totalItems}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  isLoading={isFetching}
/>
```

### 2. SearchInput Component

**File**: `/frontend/src/components/ui/data-table/SearchInput.tsx`

**Props**:
```typescript
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;  // Default: 300
  isLoading?: boolean;
}
```

**Features**:
- Debounced input (configurable delay)
- Loading spinner indicator
- Clear button (X)
- Local state for immediate UI feedback
- Syncs with parent state after debounce

**Implementation Details**:
```tsx
// Uses two useEffect hooks:
// 1. Sync local value with external value changes
// 2. Debounce local changes before calling onChange

useEffect(() => {
  setLocalValue(value);
}, [value]);

useEffect(() => {
  const timer = setTimeout(() => {
    if (localValue !== value) {
      onChange(localValue);
    }
  }, debounceMs);
  return () => clearTimeout(timer);
}, [localValue, debounceMs, onChange, value]);
```

**Usage**:
```tsx
<SearchInput
  value={searchQuery}
  onChange={handleSearch}
  placeholder="Search campaigns..."
  isLoading={isFetching}
/>
```

### 3. FilterBar Component

**File**: `/frontend/src/components/ui/data-table/FilterBar.tsx`

**Props**:
```typescript
interface FilterTag {
  key: string;
  label: string;
  value: string;
}

interface FilterBarProps {
  filters: FilterTag[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}
```

**Features**:
- Displays active filters as removable tags
- Individual remove buttons per filter
- "Clear all" button
- Automatically hides when no filters active
- Responsive layout

**Usage**:
```tsx
const activeFilterTags = useMemo(() => {
  const tags: FilterTag[] = [];
  if (statusFilters.length > 0) {
    statusFilters.forEach((status) => {
      tags.push({
        key: `status-${status}`,
        label: 'Status',
        value: status.charAt(0).toUpperCase() + status.slice(1),
      });
    });
  }
  return tags;
}, [statusFilters]);

<FilterBar
  filters={activeFilterTags}
  onRemoveFilter={removeFilter}
  onClearAll={handleClearFilters}
/>
```

### 4. SortableHeader Component

**File**: `/frontend/src/components/ui/data-table/SortableHeader.tsx`

**Props**:
```typescript
interface SortableHeaderProps {
  label: string;
  field: string;
  currentSortField?: string;
  currentSortDirection?: 'asc' | 'desc';
  onSort: (field: string) => void;
  className?: string;
}
```

**Features**:
- Visual sort indicators (arrows)
- Active field highlighting
- Toggle ascending/descending
- Hover states
- Accessible (cursor pointer, role)

**Usage** (Not yet integrated in pages):
```tsx
<th>
  <SortableHeader
    label="Campaign Name"
    field="campaignName"
    currentSortField={sortField}
    currentSortDirection={sortDirection}
    onSort={handleSort}
  />
</th>
```

## Custom Hooks

### useUrlState Hook

**File**: `/frontend/src/hooks/useUrlState.ts`

**Purpose**: Manage URL query parameters for persistent state

**API**:
```typescript
const {
  updateUrlParams,
  getParam,
  getNumberParam,
  getBooleanParam,
  getArrayParam,
  clearAllParams,
} = useUrlState();
```

**Methods**:

1. **updateUrlParams**: Update one or more URL parameters
   ```typescript
   updateUrlParams({ 
     page: 2, 
     search: 'keyword',
     status: 'active,draft' 
   });
   ```

2. **getParam**: Get a string parameter
   ```typescript
   const search = getParam('search', '');
   ```

3. **getNumberParam**: Get a numeric parameter
   ```typescript
   const page = getNumberParam('page', 1);
   ```

4. **getBooleanParam**: Get a boolean parameter
   ```typescript
   const verified = getBooleanParam('verified', false);
   ```

5. **getArrayParam**: Get a comma-separated array
   ```typescript
   const statuses = getArrayParam('status', []);
   // URL: ?status=active,draft
   // Returns: ['active', 'draft']
   ```

6. **clearAllParams**: Clear all URL parameters
   ```typescript
   clearAllParams();
   ```

**Implementation Notes**:
- Uses `window.location.search` to avoid Next.js Suspense requirements
- Updates URL without page reload using Next.js router
- Automatically handles encoding/decoding
- Removes parameters when value is null/undefined/empty

## Page Implementation Pattern

### Standard List Page Structure

```tsx
'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Pagination, SearchInput, FilterBar } from '@/components/ui/data-table';
import { useUrlState } from '@/hooks/useUrlState';

// 1. Define interfaces
interface Item {
  id: string;
  name: string;
  status: string;
  // ... other fields
}

interface PaginatedResponse {
  data: Item[];
  total: number;
  page: number;
  pages: number;
}

export default function ListPage() {
  const router = useRouter();
  
  // 2. Get URL state
  const {
    updateUrlParams,
    getParam,
    getNumberParam,
    getArrayParam,
  } = useUrlState();

  const page = getNumberParam('page', 1);
  const pageSize = getNumberParam('pageSize', 25);
  const searchQuery = getParam('search', '');
  const statusFilters = getArrayParam('status', []);
  
  // 3. Fetch data with React Query
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['items', page, pageSize, searchQuery, statusFilters],
    queryFn: async () => {
      const response = await apiClient.get('/items');
      const items = response.data.data as Item[];
      
      // Client-side filtering
      let filtered = [...items];
      if (searchQuery) {
        filtered = filtered.filter((item) => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      if (statusFilters.length > 0) {
        filtered = filtered.filter((item) => 
          statusFilters.includes(item.status)
        );
      }
      
      // Client-side pagination
      const total = filtered.length;
      const pages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedData = filtered.slice(startIndex, startIndex + pageSize);
      
      return {
        data: paginatedData,
        total,
        page,
        pages,
      } as PaginatedResponse;
    },
    placeholderData: (previousData) => previousData,
  });

  const items = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.pages || 1;
  
  // 4. Define handlers
  const handleSearch = (value: string) => {
    updateUrlParams({ search: value, page: 1 });
  };

  const handleStatusFilterChange = (status: string) => {
    const newFilters = statusFilters.includes(status)
      ? statusFilters.filter((s) => s !== status)
      : [...statusFilters, status];
    updateUrlParams({ status: newFilters.join(',') || null, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    updateUrlParams({ pageSize: newPageSize, page: 1 });
  };
  
  // 5. Build filter tags
  const activeFilterTags = useMemo(() => {
    const tags: Array<{ key: string; label: string; value: string }> = [];
    if (statusFilters.length > 0) {
      statusFilters.forEach((status) => {
        tags.push({
          key: `status-${status}`,
          label: 'Status',
          value: status,
        });
      });
    }
    return tags;
  }, [statusFilters]);
  
  // 6. Render
  return (
    <DashboardLayout>
      {/* Search and Filters */}
      <SearchInput value={searchQuery} onChange={handleSearch} />
      {/* Filter buttons */}
      <FilterBar filters={activeFilterTags} onRemoveFilter={...} />
      
      {/* Items List */}
      {items.map((item) => (...))}
      
      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </DashboardLayout>
  );
}
```

## Backend Integration

### Current Implementation (Client-Side)

Currently, all filtering, searching, and pagination happen on the client side:

```typescript
const { data } = useQuery({
  queryKey: ['items'],
  queryFn: async () => {
    const response = await apiClient.get('/items');
    // All items fetched at once
    // Filtering/pagination done in browser
  },
});
```

**Pros**:
- Works immediately without backend changes
- Instant filtering and pagination (no API calls)
- Simple implementation

**Cons**:
- Fetches all data even if only viewing page 1
- Performance issues with large datasets (1000+ items)
- Increased bandwidth usage

### Future Implementation (Server-Side)

When backend supports pagination:

**Backend API Requirements**:
```
GET /campaigns?page=1&limit=25&search=keyword&status=active,draft&sortField=name&sortDirection=asc

Response:
{
  "success": true,
  "data": [...],      // Items for this page only
  "total": 247,       // Total items matching filters
  "page": 1,          // Current page
  "pages": 10         // Total pages
}
```

**Frontend Changes**:
```typescript
const { data } = useQuery({
  queryKey: ['items', page, pageSize, searchQuery, statusFilters],
  queryFn: async () => {
    const response = await apiClient.get('/items', {
      params: {
        page,
        limit: pageSize,
        search: searchQuery || undefined,
        status: statusFilters.join(',') || undefined,
        sortField,
        sortDirection,
      },
    });
    // Response already paginated and filtered
    return response.data;
  },
});
```

**Migration Steps**:
1. Update backend routes to accept query parameters
2. Implement database-level filtering and pagination
3. Update frontend to send parameters
4. Remove client-side filtering logic
5. Test thoroughly with various filter combinations

## Performance Optimizations

### 1. Debouncing

Search input uses debouncing to reduce unnecessary queries:

```typescript
const [localValue, setLocalValue] = useState(value);

useEffect(() => {
  const timer = setTimeout(() => {
    if (localValue !== value) {
      onChange(localValue);
    }
  }, 300); // Wait 300ms after last keystroke
  
  return () => clearTimeout(timer);
}, [localValue]);
```

### 2. Memoization

Filter calculations are memoized to prevent unnecessary re-renders:

```typescript
const activeFilterTags = useMemo(() => {
  // Expensive calculation
  return tags;
}, [statusFilters]); // Only recalculate when dependencies change
```

### 3. Placeholder Data

React Query's `placeholderData` keeps previous data visible during refetch:

```typescript
const { data } = useQuery({
  // ...
  placeholderData: (previousData) => previousData,
  // Prevents "loading" state when refetching
  // Shows old data until new data arrives
});
```

### 4. Query Key Management

React Query automatically caches and refetches based on query keys:

```typescript
queryKey: ['campaigns', page, pageSize, searchQuery, statusFilters]
// Changes to any part of the key trigger a new fetch
// Identical keys return cached data
```

## Styling

All components use Tailwind CSS with the application's design system:

**Color Scheme**:
- Primary: Purple (`purple-600`, `purple-700`)
- Text: Gray scale (`gray-600`, `gray-900`)
- Backgrounds: Gray scale (`gray-50`, `gray-100`)
- States: Green (success), Red (error), Yellow (warning)

**Responsive Breakpoints**:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up

**Component Styling**:
```tsx
// Example from Pagination
<Button
  variant="outline"
  size="sm"
  onClick={...}
  disabled={currentPage === 1 || isLoading}
  className="h-8 w-8 p-0"
/>
```

## Testing

### Unit Testing

Test individual components in isolation:

```typescript
describe('Pagination', () => {
  it('disables previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        pageSize={25}
        totalItems={100}
        onPageChange={jest.fn()}
        onPageSizeChange={jest.fn()}
      />
    );
    
    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
  });
});
```

### Integration Testing

Test full page behavior:

```typescript
describe('CampaignsPage', () => {
  it('filters campaigns by status', async () => {
    render(<CampaignsPage />);
    
    // Click active filter
    const activeButton = screen.getByText('Active');
    fireEvent.click(activeButton);
    
    // Check URL updated
    expect(window.location.search).toContain('status=active');
    
    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('Active Campaign')).toBeInTheDocument();
      expect(screen.queryByText('Draft Campaign')).not.toBeInTheDocument();
    });
  });
});
```

### E2E Testing

Test complete user workflows:

```typescript
test('user can filter, search, and paginate campaigns', async ({ page }) => {
  await page.goto('/dashboard/campaigns');
  
  // Search
  await page.fill('[placeholder="Search campaigns..."]', 'summer');
  await page.waitForTimeout(400); // Debounce
  
  // Filter
  await page.click('text=Active');
  
  // Verify URL
  expect(page.url()).toContain('search=summer&status=active');
  
  // Change page
  await page.click('[aria-label="Next page"]');
  expect(page.url()).toContain('page=2');
});
```

## Troubleshooting

### Common Issues

**1. Search not debouncing**
- Verify debounceMs is set correctly
- Check that onChange is memoized or stable
- Ensure component doesn't remount on each keystroke

**2. Filters not persisting in URL**
- Check that updateUrlParams is being called
- Verify URL params are being read on mount
- Ensure router is from next/navigation, not next/router

**3. Pagination showing wrong page count**
- Verify total items count is correct
- Check Math.ceil calculation for pages
- Ensure pageSize is applied correctly

**4. Loading states flickering**
- Use placeholderData to keep previous data
- Check isFetching vs isLoading states
- Verify query keys are stable

## Future Enhancements

### 1. Column Sorting

Add sortable column headers:

```tsx
const handleSort = (field: string) => {
  if (sortField === field) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    setSortField(field);
    setSortDirection('asc');
  }
  updateUrlParams({ sortField: field, sortDirection });
};

<th>
  <SortableHeader
    label="Name"
    field="campaignName"
    currentSortField={sortField}
    currentSortDirection={sortDirection}
    onSort={handleSort}
  />
</th>
```

### 2. Advanced Filters

Add date range pickers and sliders:

```tsx
<DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onChange={(start, end) => {
    updateUrlParams({ 
      startDate: start?.toISOString(),
      endDate: end?.toISOString()
    });
  }}
/>

<RangeSlider
  min={0}
  max={10000}
  value={budgetRange}
  onChange={(range) => {
    updateUrlParams({
      budgetMin: range[0],
      budgetMax: range[1]
    });
  }}
/>
```

### 3. Saved Filters

Allow users to save filter presets:

```tsx
const saveFilter = () => {
  const preset = {
    name: 'Active Summer Campaigns',
    filters: { status: 'active', search: 'summer' },
  };
  // Save to backend or localStorage
};

const loadFilter = (preset) => {
  updateUrlParams(preset.filters);
};
```

### 4. Export Functionality

Export filtered results:

```tsx
const exportToCsv = () => {
  const csv = convertToCSV(items);
  downloadFile(csv, 'campaigns.csv');
};
```

## Contributing

When adding new list features:

1. Follow the established component pattern
2. Add TypeScript interfaces
3. Include accessibility features (ARIA labels, keyboard nav)
4. Write unit tests
5. Update this documentation
6. Consider performance implications
7. Ensure responsive design

## API Reference

See component prop interfaces above for detailed API documentation.

## Support

For questions or issues:
- Check this guide first
- Review component source code
- Check React Query documentation
- Contact the development team
