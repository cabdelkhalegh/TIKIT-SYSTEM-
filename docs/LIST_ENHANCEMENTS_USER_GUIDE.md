# List Enhancements - User Guide

## Overview
The campaigns, influencers, and collaborations pages now feature professional data table capabilities including pagination, search, filtering, and URL-based state management.

## Features

### 1. Pagination

Navigate through large datasets efficiently with pagination controls at the bottom of each list.

**Features:**
- **First/Last Page**: Jump to the beginning or end of the list
- **Previous/Next**: Move one page at a time
- **Current Page**: See which page you're on (e.g., "Page 2 of 10")
- **Items Per Page**: Choose how many items to display (10, 25, 50, or 100)
- **Item Count**: See the range of items currently displayed (e.g., "Showing 26-50 of 247")

**How to Use:**
1. Click the page size dropdown to change how many items appear per page
2. Use the arrow buttons to navigate between pages
3. Use the double-arrow buttons to jump to first or last page
4. The current page and total pages are displayed in the center

**Keyboard Navigation:**
- The pagination controls are keyboard accessible
- Use Tab to focus on controls, Enter/Space to activate

### 2. Search

Find specific items quickly with the debounced search feature.

**Search Fields:**
- **Campaigns**: Searches in campaign name and client name
- **Influencers**: Searches in full name and niche
- **Collaborations**: Searches in campaign name and influencer name

**Features:**
- **Auto-search**: Results update automatically as you type (after 300ms pause)
- **Loading Indicator**: Spinner shows while searching
- **Clear Button**: Click the X to clear your search
- **Case Insensitive**: Search works regardless of capitalization

**How to Use:**
1. Type in the search box at the top of the list
2. Wait for results to update (happens automatically)
3. Click the X button to clear your search
4. Search works with filters - you can combine both

### 3. Filters

Refine your list with multi-select filters.

**Available Filters:**

**Campaigns:**
- Status: Active, Draft, Paused, Completed, Cancelled

**Influencers:**
- Niche: Fashion, Beauty, Tech, Food, Travel, etc. (based on your data)

**Collaborations:**
- Status: Pending, Accepted, In Progress, Completed, Cancelled

**Features:**
- **Multi-Select**: Click multiple filters to combine them
- **Active Filter Tags**: See which filters are active with removable tags
- **Individual Remove**: Click the X on any filter tag to remove it
- **Clear All**: Remove all filters with one click

**How to Use:**
1. Click any filter button to activate it
2. Click again to deactivate
3. Combine multiple filters - results match ANY selected filter
4. View active filters as tags below the filter buttons
5. Remove individual filters by clicking the X on their tag
6. Click "Clear all" to remove all filters at once

### 4. URL State Management

Share filtered views with others using shareable URLs.

**Features:**
- **Persistent State**: All your filters, search, and page settings are saved in the URL
- **Shareable Links**: Copy and share URLs with your exact view
- **Browser Navigation**: Back/forward buttons work as expected
- **Bookmarkable**: Bookmark frequently used filter combinations

**How to Use:**
1. Set up your filters, search, and pagination as desired
2. Copy the URL from your browser's address bar
3. Share this URL with others - they'll see the exact same filtered view
4. Use browser back/forward to navigate through your filter history
5. Bookmark URLs for quick access to common views

**URL Parameters:**
- `page`: Current page number
- `pageSize`: Items per page
- `search`: Search query
- `status`: Selected status filters (comma-separated)
- `niche`: Selected niche filters (comma-separated)

Example URL:
```
/dashboard/campaigns?page=2&pageSize=25&search=summer&status=active,draft
```

### 5. Empty States

Get contextual guidance when no results are found.

**Empty States:**

**No Data at All:**
- Shows a helpful message and icon
- Displays a "Create New" button to get started
- Example: "Get started by creating your first campaign"

**No Results with Filters:**
- Indicates that your filters didn't match anything
- Shows a "Clear Filters" button to reset
- Example: "No campaigns match your filters. Try adjusting your search or filters."

**How to Use:**
1. If you see "No items found" with filters active, try:
   - Adjusting your search query
   - Removing some filters
   - Clicking "Clear Filters" to start over
2. If you see "No items found" with no filters, create your first item

### 6. Loading States

Visual feedback during data loading.

**Loading States:**

**Initial Load:**
- Shows skeleton loading cards (6 placeholder cards)
- Preserves the layout to prevent content shift

**During Search/Filter:**
- Small spinner in the search input
- Pagination controls become disabled
- Previous results remain visible

**During Page Change:**
- Pagination controls are disabled
- Current data remains visible
- Smooth transition to new page

**How It Works:**
- Loading states appear automatically
- No interaction needed from you
- Previous data stays visible to maintain context

## Tips & Best Practices

### Search Tips:
1. **Be Specific**: More specific searches return better results
2. **Partial Matches**: You don't need to type the full name
3. **Combine with Filters**: Use search + filters for precise results
4. **Clear When Done**: Clear search to see full filtered list

### Filter Tips:
1. **Start Broad**: Begin with one filter, add more to narrow down
2. **Use Multiple Statuses**: Select multiple statuses to compare
3. **Monitor Active Filters**: Check the filter tags to see what's active
4. **Reset Often**: Use "Clear all" to start fresh

### Pagination Tips:
1. **Adjust Page Size**: Use larger page sizes for scanning, smaller for details
2. **Use First/Last**: Jump quickly when you know what you're looking for
3. **Bookmark Pages**: Save URLs of specific pages you visit often
4. **Consider Total Items**: Check the item count to gauge dataset size

### Performance Tips:
1. **Use Filters First**: Filter before searching for better performance
2. **Appropriate Page Size**: Don't use 100 items/page unless needed
3. **Specific Searches**: Specific searches are faster than broad ones
4. **Clear Unused Filters**: Remove filters you're not using

## Common Workflows

### Finding a Specific Campaign:
1. Use the search box to type part of the campaign name
2. Add status filter if you know the status
3. Results update automatically

### Viewing All Active Campaigns:
1. Click the "Active" filter button
2. Adjust page size if needed
3. Share the URL to bookmark this view

### Comparing Influencers in a Niche:
1. Select the niche filter (e.g., "Fashion")
2. Increase page size to see more at once
3. Use search to narrow further if needed

### Reviewing Pending Collaborations:
1. Click "Pending" filter
2. Sort by date (when sorting is implemented)
3. Work through them page by page

## Troubleshooting

### Problem: "No results found"
**Solution**: 
- Check if you have filters active (look for filter tags)
- Try clearing filters with "Clear all"
- Make your search less specific
- Verify there is data in the system

### Problem: Page controls disabled
**Solution**: 
- Wait for loading to complete (look for spinner)
- Check if you're on the last page (Next/Last disabled)
- Check if you're on the first page (Previous/First disabled)

### Problem: Search not updating
**Solution**: 
- Wait 300ms after typing (debounce delay)
- Check internet connection
- Refresh the page if needed

### Problem: Filters not working
**Solution**: 
- Verify the filter button is highlighted/selected
- Check the filter tags below to confirm it's active
- Try clicking the filter again to toggle
- Clear and reapply filters if needed

### Problem: URL not updating
**Solution**: 
- Check if JavaScript is enabled
- Verify you're not in incognito mode with restrictions
- Try refreshing the page

## Accessibility

All list enhancement features are accessible:

- **Keyboard Navigation**: Tab through controls, Enter/Space to activate
- **Screen Readers**: ARIA labels on all interactive elements
- **Focus Indicators**: Clear visual focus states
- **Button States**: Disabled states clearly indicated
- **Semantic HTML**: Proper use of buttons, inputs, and labels

### Keyboard Shortcuts:
- Tab: Move between controls
- Enter/Space: Activate buttons
- Escape: Clear search (when focused)

## Future Features

Coming soon:
- Column sorting (click headers to sort)
- Advanced filters (date ranges, budget sliders)
- Saved filter presets
- Export to CSV/Excel
- Bulk actions
- Column customization

## Support

For issues or questions about list features:
1. Check this guide for common solutions
2. Verify your browser is up to date
3. Try clearing browser cache
4. Contact support with specific details
