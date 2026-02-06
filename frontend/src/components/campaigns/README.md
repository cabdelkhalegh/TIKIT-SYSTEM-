# Campaign Components

## CampaignFormModal

A comprehensive modal component for creating new influencer marketing campaigns on the TIKIT platform.

### Features

- **Complete Form Validation**: Uses React Hook Form with Zod schema validation
- **Multi-Platform Support**: Select from Instagram, YouTube, TikTok, Twitter, and Facebook
- **Date Range Validation**: Ensures end date is after start date
- **Budget Management**: Number input with minimum value validation
- **Campaign Types**: Choose from awareness, engagement, conversion, or mixed campaigns
- **API Integration**: Built-in React Query mutation with loading states
- **Toast Notifications**: Success and error feedback using Sonner
- **Responsive Design**: Mobile-friendly layout with Tailwind CSS
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Usage

#### Basic Usage with Default Trigger

\`\`\`tsx
import { CreateCampaignButton } from '@/components/campaigns';

function CampaignsPage() {
  return (
    <div>
      <h1>Campaigns</h1>
      <CreateCampaignButton />
    </div>
  );
}
\`\`\`

#### Custom Trigger

\`\`\`tsx
import { CampaignFormModal } from '@/components/campaigns';
import { Button } from '@/components/ui/button';

function CustomTrigger() {
  return (
    <CampaignFormModal>
      <Button variant="outline">
        Custom Button Text
      </Button>
    </CampaignFormModal>
  );
}
\`\`\`

### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Campaign Name | Text | Yes | 3-100 characters |
| Description | Textarea | No | - |
| Start Date | Date | Yes | Valid date |
| End Date | Date | Yes | Must be after start date |
| Total Budget | Number | Yes | >= 0 |
| Target Audience | Textarea | No | - |
| Platforms | Multi-select | Yes | At least 1 platform |
| Campaign Type | Dropdown | Yes | One of: awareness, engagement, conversion, mixed |

### API Integration

The component integrates with the `/campaigns` POST endpoint and expects the following request format:

\`\`\`json
{
  "campaignName": "Summer Product Launch 2024",
  "description": "Campaign description",
  "startDate": "2024-06-01",
  "endDate": "2024-08-31",
  "totalBudget": 50000,
  "targetAudience": {
    "description": "Women aged 25-35 interested in fitness"
  },
  "platforms": ["instagram", "youtube"],
  "campaignType": "awareness",
  "status": "draft"
}
\`\`\`

### Behavior

- **On Success**: 
  - Shows success toast
  - Invalidates 'campaigns' query cache to refresh the list
  - Closes modal
  - Resets form

- **On Error**: 
  - Shows error toast with message from API
  - Keeps modal open
  - Maintains form state

### Styling

The component uses the following design patterns:
- Purple accent color (`purple-600`) for primary actions
- Responsive grid layout for form fields
- Tailwind CSS utility classes
- Consistent spacing and typography
- Loading states with spinner animation

### Dependencies

- React Hook Form
- Zod validation
- React Query
- Sonner (toasts)
- Radix UI Dialog
- Lucide React icons
- shadcn/ui components

### Example Implementation

See `/src/app/dashboard/campaigns/page.tsx` for a complete implementation example.
