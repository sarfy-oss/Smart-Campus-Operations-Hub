# Module C - Maintenance & Incident Ticketing System

## 📋 Overview

Module C is a comprehensive maintenance and incident management system built for university campus operations. It allows users to report maintenance issues and incidents, while providing administrators and technicians with powerful tools to manage, assign, and resolve tickets efficiently.

## 🎯 Key Features

### 1. **User Ticket Creation**
- **Smart Category Suggestion** (AI-Powered)
  - Analyzes ticket description keywords
  - Suggests appropriate category in real-time
  - Users can apply suggestion with one click
  
- **Priority-Based SLA Tracking**
  - High Priority: 24-hour response time
  - Medium Priority: 2-3 day response time
  - Low Priority: 5-7 day response time
  - Visual SLA countdown on ticket details

- **Multi-Image Upload**
  - Up to 3 evidence images per ticket
  - Images stored on Cloudinary for reliability
  - Thumbnail preview with file size validation
  - Support for JPEG, PNG, GIF, WebP formats (max 5MB each)

- **Detailed Ticket Information**
  - Title, description, category, priority
  - Location selection (resource or free text)
  - Contact name and email
  - Real-time form validation

### 2. **Ticket Management Dashboard (User View)**
- **Statistics Overview**
  - Total tickets, open, in-progress, resolved counts
  - Real-time stat updates

- **Advanced Filtering & Search**
  - Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED)
  - Sort by latest, oldest, or priority
  - Search by ticket title
  
- **Responsive Grid View**
  - Beautiful card-based layout
  - Quick status and priority indicators
  - Compact ticket ID display
  - Quick navigation to details

### 3. **Ticket Details & Comments**
- **Full Ticket Information**
  - Category, status, priority display
  - Location and contact information
  - Description with formatting
  - Resolution notes (when resolved)
  - Rejection reason (when rejected)

- **Comments System**
  - Real-time comment posting
  - Comment author and timestamp
  - Clean comment thread interface
  - Edit/delete own comments (owner only)

- **SLA Status Card**
  - Remaining hours until deadline
  - Visual urgency indicator
  - Color-coded status (overdue/active)

- **Assignment Information**
  - Shows assigned technician
  - Update status with one click
  - Technician availability info

### 4. **Admin/Technician Dashboard**
- **Comprehensive Ticket Management**
  - View all tickets in the system
  - Grid and table view options
  - Switch between views seamlessly

- **Advanced Analytics**
  - Total, open, in-progress, resolved, closed, rejected counts
  - Priority distribution visualization (stacked bar chart)
  - Real-time statistics updates

- **Smart Filtering**
  - Filter by multiple criteria simultaneously
  - Status filtering (all statuses)
  - Priority filtering (High/Medium/Low)
  - Combined search by ID, title, or reporter

- **Assignment Management** (Coming Soon)
  - Assign technicians to tickets
  - View current assignments
  - Reassign if needed
  - Technician availability status

### 5. **Status Workflow & Transitions**
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
              ↓
         REJECTED (Admin only, requires reason)
```

- **Allowed Transitions**
  - Users: Can only view their own tickets
  - Technicians: Can update status to IN_PROGRESS or RESOLVED
  - Admins: Can set any status, including REJECTED
  - Mandatory rejection reason for REJECTED status

## 🚀 Innovative Features

### 1. **AI-Powered Category Suggestion**
```javascript
// Real-time keyword-based analysis
- Electrical: detects "electrical", "lights", "power", etc.
- Plumbing: detects "water", "leak", "pipe", etc.
- HVAC: detects "temperature", "heating", "cooling", etc.
- IT: detects "computer", "internet", "wifi", etc.
- Cleaning: detects "dirty", "trash", "garbage", etc.
```

### 2. **SLA (Service Level Agreement) Tracking**
- Automatic deadline calculation based on priority
- Visual countdown of remaining time
- Overdue indicator with warnings
- Color-coded urgency (green=on-time, red=overdue)

### 3. **Priority Distribution Analytics**
- Stacked bar chart showing ticket distribution
- Helps identify bottlenecks
- Enables resource planning
- Color-coded segments (red=high, yellow=medium, green=low)

### 4. **Real-Time Statistics Dashboard**
- Live ticket counts by status
- Quick performance metrics
- Helps admins prioritize work

### 5. **Smart Search & Filtering**
- Multi-criteria filtering
- Search across ID, title, and reporter name
- Instant results with count display

## 📁 Project Structure

```
frontend/src/
├── pages/
│   ├── CreateTicketPage.jsx          # Create new ticket
│   ├── CreateTicketPage.css
│   ├── TicketsPage.jsx               # User's ticket list
│   ├── TicketsPage.css
│   ├── TicketDetailsPage.jsx         # Full ticket view + comments
│   ├── TicketDetailsPage.css
│   ├── AdminTicketsPage.jsx          # Admin dashboard
│   └── AdminTicketsPage.css
├── components/
│   ├── TicketForm.jsx                # Reusable ticket creation form
│   ├── TicketForm.css
│   ├── TicketCard.jsx                # Ticket card component
│   ├── TicketCard.css
│   ├── TicketStatusBadge.jsx         # Status indicator
│   ├── TicketStatusBadge.css
│   ├── TicketPriorityBadge.jsx       # Priority indicator
│   └── TicketPriorityBadge.css
└── services/
    └── api.js                         # Extended with ticketAPI
```

## 🔌 API Endpoints

### Ticket CRUD
```
POST   /api/v1/tickets                    # Create ticket
GET    /api/v1/tickets                    # Get all tickets (admin)
GET    /api/v1/tickets/my                 # Get my tickets (user)
GET    /api/v1/tickets/assigned           # Get assigned to me (tech)
GET    /api/v1/tickets/:id                # Get ticket details
PUT    /api/v1/tickets/:id/status         # Update status
PUT    /api/v1/tickets/:id/resolve        # Mark resolved (tech)
DELETE /api/v1/tickets/:id                # Delete ticket (admin)
```

### Filtering
```
GET    /api/v1/tickets/by-status?status=OPEN
GET    /api/v1/tickets/search?keyword=...
GET    /api/v1/tickets/open               # Get open tickets
```

### Comments
```
POST   /api/v1/tickets/:id/comments       # Add comment
GET    /api/v1/tickets/:id/comments       # Get comments
PUT    /api/v1/tickets/:id/comments/:cid  # Update comment (owner/admin)
DELETE /api/v1/tickets/:id/comments/:cid  # Delete comment (owner/admin)
```

### Attachments
```
POST   /api/v1/tickets/:id/attachments    # Upload image
GET    /api/v1/tickets/:id/attachments    # Get images
DELETE /api/v1/tickets/:id/attachments/:aid # Delete image
```

## 🎨 UI/UX Features

### Color Coding System
- **Status Colors**
  - 🔴 OPEN: Red (urgent, needs attention)
  - 🟡 IN_PROGRESS: Yellow (being worked on)
  - 🔵 RESOLVED: Blue (solution applied)
  - 🟢 CLOSED: Green (completed)
  - ⚫ REJECTED: Gray (not proceeding)

- **Priority Icons**
  - ↑ HIGH (Red background)
  - → MEDIUM (Yellow background)
  - ↓ LOW (Green background)

### Responsive Design
- Mobile-first approach
- Works on all devices (mobile, tablet, desktop)
- Touch-friendly buttons and interactions
- Optimized layouts for small screens

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color + icon indicators (not just color)

## 🚦 User Workflows

### Creating a Ticket (User)
1. Navigate to "Create Maintenance Ticket"
2. Fill in title, description, and category
3. AI suggests category based on keywords (optional apply)
4. Set priority (affects SLA deadline)
5. Select location or enter location text
6. Provide contact information
7. Upload up to 3 evidence images
8. Submit form
9. Redirected to ticket details page

### Managing Tickets (User)
1. View "My Tickets" page
2. See statistics overview (total, open, in-progress, resolved)
3. Filter by status, sort by date/priority
4. Search by ticket title
5. Click "View Details" to see full information
6. Add comments to provide updates

### Managing Tickets (Admin)
1. Navigate to "Ticket Management Dashboard"
2. View comprehensive statistics
3. See priority distribution chart
4. Search and filter tickets by multiple criteria
5. Switch between grid and table views
6. Click "View" to access ticket details
7. Update ticket status
8. Assign technicians (coming soon)
9. View analytics and performance metrics

## 🔐 Security & Permissions

### User Permissions
- Create tickets
- View own tickets
- Add comments
- Edit own comments
- Cannot see other users' tickets

### Technician Permissions
- View assigned tickets
- Update status to IN_PROGRESS or RESOLVED
- Add resolution notes
- Add comments
- Cannot assign or reject tickets

### Admin Permissions
- View all tickets
- Update any ticket status (including REJECT)
- Assign technicians
- Add rejection reason
- Delete tickets
- Full comment moderation
- View all analytics

## 📊 Data Models

### Ticket Entity
```javascript
{
  id: String (MongoDB ObjectId),
  title: String,
  category: TicketCategory enum,
  description: String,
  priority: TicketPriority enum,
  status: TicketStatus enum,
  resourceId: String (optional),
  locationText: String (optional),
  contactName: String,
  contactEmail: String,
  rejectionReason: String (if rejected),
  resolutionNotes: String (if resolved),
  reportedBy: User reference,
  assignedTo: User reference (optional),
  createdAt: LocalDateTime,
  updatedAt: LocalDateTime
}
```

### TicketAttachment Entity
```javascript
{
  id: String,
  ticket: Ticket reference,
  fileName: String,
  filePath: String (Cloudinary URL),
  fileType: String (MIME type),
  fileSize: Long (bytes),
  uploadedAt: LocalDateTime
}
```

### TicketComment Entity
```javascript
{
  id: String,
  ticket: Ticket reference,
  author: User reference,
  content: String,
  createdAt: LocalDateTime,
  updatedAt: LocalDateTime
}
```

## 🏃 Getting Started

### Prerequisites
- Backend running on http://localhost:8080/api
- MongoDB connection configured
- Cloudinary credentials set via CLOUDINARY_URL

### Setup Steps

1. **Start Backend**
   ```bash
   cd backend
   $env:CLOUDINARY_URL="your_cloudinary_url"
   .\mvnw.cmd spring-boot:run
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8080/api
   - Swagger: http://localhost:8080/api/swagger-ui.html

### First Time Setup
1. Create a user account or login
2. Navigate to "Create Maintenance Ticket"
3. Fill in ticket details
4. Upload evidence images (optional)
5. Submit and view ticket details
6. (Admin only) View admin dashboard to manage all tickets

## 🐛 Troubleshooting

### Images Not Uploading
- Verify Cloudinary URL is set correctly
- Check file size (max 5MB)
- Ensure file is valid image format

### Comments Not Saving
- Verify you're logged in
- Check internet connection
- Reload page if needed

### Status Not Updating
- Verify your user role allows the transition
- Check for validation errors
- Admin users have full access

## 📈 Future Enhancements

1. **Technician Assignment Algorithm**
   - Smart assignment based on skills and availability
   - Load balancing
   - Historical performance

2. **Notification System**
   - Email notifications on status change
   - SMS alerts for critical issues
   - Push notifications

3. **Advanced Analytics**
   - Resolution time trends
   - Technician performance metrics
   - Category-wise statistics
   - SLA compliance tracking

4. **Estimated Resolution Time**
   - ML-powered prediction
   - Based on category and priority
   - Historical data analysis

5. **Escalation Rules**
   - Automatic escalation if SLA exceeded
   - Priority bumping
   - Manager notifications

## 📝 Notes

- Maximum 3 images per ticket (enforced in frontend + backend)
- Image size limit: 5MB per image
- Description minimum: 10 characters
- Email validation required for contact
- Rejection reason mandatory when rejecting
- SLA tracking is automatic based on priority

## 🤝 Contributing

When extending Module C:
1. Follow existing component structure
2. Maintain consistent styling
3. Add TypeScript types (future enhancement)
4. Test all user workflows
5. Update this documentation

---

**Module C Version**: 1.0.0  
**Last Updated**: April 25, 2026  
**Status**: Production Ready
