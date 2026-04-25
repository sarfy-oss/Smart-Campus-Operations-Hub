# Module C – Maintenance & Incident Ticketing
## Implementation Plan — IT3030 PAF Assignment 2026

> **Stack:** Spring Boot REST API + React Client  
> **Roles:** `USER` · `ADMIN` · `TECHNICIAN`  
> **Your module covers:** Member 3 scope — Incident tickets, attachments, technician updates, comments

---

## 1. Functional Requirements

### 1.1 Ticket Management
- A **USER** can create an incident ticket linked to a resource or location, providing:
  - Category (e.g., `ELECTRICAL`, `EQUIPMENT`, `NETWORK`, `STRUCTURAL`, `OTHER`)
  - Description (free text)
  - Priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
  - Preferred contact details (name, phone/email)
- A ticket can have **up to 3 image attachments** (evidence photos)
- A **USER** can view their own submitted tickets
- An **ADMIN** can view all tickets with filter/search support
- A **TECHNICIAN** can view tickets assigned to them

### 1.2 Ticket Workflow
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
              ↘ REJECTED (Admin only, with reason)
```
- `OPEN` — set automatically on ticket creation
- `IN_PROGRESS` — set by ADMIN or TECHNICIAN when work begins
- `RESOLVED` — set by TECHNICIAN after work is complete (with resolution notes)
- `CLOSED` — set by ADMIN to formally close a resolved ticket
- `REJECTED` — set by ADMIN with a mandatory rejection reason

### 1.3 Technician Assignment
- An **ADMIN** can assign a TECHNICIAN to any ticket
- A **TECHNICIAN** assigned to a ticket can:
  - Update ticket status (`IN_PROGRESS`, `RESOLVED`)
  - Add resolution notes

### 1.4 Comments
- A **USER** can add comments to their own tickets
- A **TECHNICIAN** can add comments to any assigned ticket
- An **ADMIN** can add comments to any ticket
- **Edit** — only the comment author can edit their own comment
- **Delete** — the comment author can delete their own comment; ADMIN can delete any comment

### 1.5 Non-Functional Requirements
| Area | Requirement |
|---|---|
| Security | Role-based access on all endpoints; safe file upload handling (type/size validation) |
| Validation | All fields validated server-side; meaningful error responses |
| Performance | Image uploads stored efficiently; paginated list responses |
| Auditability | `createdAt`, `updatedAt` timestamps on tickets and comments |

---

## 2. Database Design

### `tickets` table
| Column | Type | Notes |
|---|---|---|
| `id` | UUID / BIGINT PK | Auto-generated |
| `title` | VARCHAR(255) | Short summary |
| `category` | ENUM | `ELECTRICAL`, `EQUIPMENT`, `NETWORK`, `STRUCTURAL`, `OTHER` |
| `description` | TEXT | Full description |
| `priority` | ENUM | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | ENUM | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED` |
| `resource_id` | FK (nullable) | Linked resource/location |
| `location_text` | VARCHAR(255) | Free-text location fallback |
| `contact_name` | VARCHAR(100) | Preferred contact |
| `contact_info` | VARCHAR(255) | Email or phone |
| `rejection_reason` | TEXT | Populated on REJECTED |
| `resolution_notes` | TEXT | Populated on RESOLVED |
| `reported_by` | FK → users | The USER who created the ticket |
| `assigned_to` | FK → users (nullable) | The TECHNICIAN assigned |
| `created_at` | TIMESTAMP | Auto |
| `updated_at` | TIMESTAMP | Auto |

### `ticket_attachments` table
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `ticket_id` | FK → tickets | |
| `file_name` | VARCHAR(255) | Original filename |
| `file_path` | VARCHAR(500) | Server storage path or object key |
| `file_type` | VARCHAR(50) | MIME type (image/jpeg, image/png, etc.) |
| `uploaded_at` | TIMESTAMP | |

### `ticket_comments` table
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `ticket_id` | FK → tickets | |
| `author_id` | FK → users | |
| `content` | TEXT | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

---

## 3. REST API Endpoints

> Minimum requirement: at least **4 endpoints using different HTTP methods** (GET, POST, PUT/PATCH, DELETE).  
> The list below exceeds this comfortably — pick your core 4+ for individual assessment visibility.

### 3.1 Ticket Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/tickets` | USER | Create a new incident ticket |
| `GET` | `/api/v1/tickets` | ADMIN | Get all tickets (with filters: status, priority, category, assignee) |
| `GET` | `/api/v1/tickets/my` | USER | Get tickets submitted by the current user |
| `GET` | `/api/v1/tickets/assigned` | TECHNICIAN | Get tickets assigned to the current technician |
| `GET` | `/api/v1/tickets/{id}` | USER(own), ADMIN, TECHNICIAN(assigned) | Get a single ticket by ID |
| `PATCH` | `/api/v1/tickets/{id}/status` | ADMIN, TECHNICIAN | Update ticket status |
| `PATCH` | `/api/v1/tickets/{id}/assign` | ADMIN | Assign a technician to a ticket |
| `PATCH` | `/api/v1/tickets/{id}/resolve` | TECHNICIAN | Mark resolved with resolution notes |
| `DELETE` | `/api/v1/tickets/{id}` | ADMIN | Delete a ticket (hard or soft delete) |

### 3.2 Attachment Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/tickets/{id}/attachments` | USER(own) | Upload image attachments (max 3, multipart/form-data) |
| `GET` | `/api/v1/tickets/{id}/attachments` | USER(own), ADMIN, TECHNICIAN(assigned) | List attachments for a ticket |
| `DELETE` | `/api/v1/tickets/{id}/attachments/{attachmentId}` | USER(own), ADMIN | Delete a specific attachment |

### 3.3 Comment Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/tickets/{id}/comments` | USER(own), ADMIN, TECHNICIAN(assigned) | Add a comment |
| `GET` | `/api/v1/tickets/{id}/comments` | USER(own), ADMIN, TECHNICIAN(assigned) | Get all comments for a ticket |
| `PUT` | `/api/v1/tickets/{id}/comments/{commentId}` | Author only | Edit own comment |
| `DELETE` | `/api/v1/tickets/{id}/comments/{commentId}` | Author, ADMIN | Delete a comment |

### HTTP Status Codes to Use
| Scenario | Code |
|---|---|
| Resource created | `201 Created` |
| Success with body | `200 OK` |
| Success no body | `204 No Content` |
| Validation error | `400 Bad Request` |
| Not authenticated | `401 Unauthorized` |
| Forbidden action | `403 Forbidden` |
| Not found | `404 Not Found` |
| Conflict (e.g., >3 attachments) | `409 Conflict` |

---

## 4. Spring Boot Backend Architecture

### Package Structure
```
com.smartcampus.tickets
├── config/
│   └── SecurityConfig.java          # JWT/OAuth2 + role-based rules
├── controller/
│   ├── TicketController.java
│   ├── AttachmentController.java
│   └── CommentController.java
├── service/
│   ├── TicketService.java
│   ├── AttachmentService.java
│   └── CommentService.java
├── repository/
│   ├── TicketRepository.java        # JPA
│   ├── AttachmentRepository.java
│   └── CommentRepository.java
├── model/
│   ├── Ticket.java                  # @Entity
│   ├── TicketAttachment.java
│   └── TicketComment.java
├── dto/
│   ├── request/
│   │   ├── CreateTicketRequest.java
│   │   ├── UpdateStatusRequest.java
│   │   ├── AssignTechnicianRequest.java
│   │   ├── ResolveTicketRequest.java
│   │   └── CommentRequest.java
│   └── response/
│       ├── TicketResponse.java
│       ├── AttachmentResponse.java
│       └── CommentResponse.java
├── enums/
│   ├── TicketStatus.java
│   ├── TicketPriority.java
│   └── TicketCategory.java
└── exception/
    ├── TicketNotFoundException.java
    ├── UnauthorizedActionException.java
    └── MaxAttachmentsExceededException.java
```

### Key Implementation Notes

**File Upload (Attachments)**
- Use `@RequestParam("files") List<MultipartFile> files` in controller
- Validate: max 3 files, allowed MIME types (`image/jpeg`, `image/png`, `image/webp`), max file size (e.g., 5MB each)
- Store files on local disk (`/uploads/tickets/{ticketId}/`) or cloud (S3-compatible)
- Save file metadata to `ticket_attachments` table
- Return accessible URL in response

**Status Transition Guard (Service Layer)**
```java
// Only allow valid transitions
private void validateStatusTransition(TicketStatus current, TicketStatus next, Role role) {
    // e.g., only ADMIN can set REJECTED
    // TECHNICIAN can only move OPEN→IN_PROGRESS, IN_PROGRESS→RESOLVED
}
```

**Comment Ownership (Security)**
- Inject authenticated user from `SecurityContext`
- Check `comment.getAuthor().getId().equals(currentUser.getId())` before allowing edit/delete
- ADMIN bypasses ownership check for delete

**Validation with `@Valid`**
```java
// CreateTicketRequest.java
@NotBlank private String title;
@NotNull private TicketCategory category;
@NotBlank private String description;
@NotNull private TicketPriority priority;
@NotBlank private String contactName;
@Email private String contactEmail;
```

---

## 5. React Frontend Architecture

### Pages & Components

```
src/
├── pages/
│   ├── tickets/
│   │   ├── TicketListPage.jsx          # USER: my tickets | ADMIN: all tickets | TECH: assigned
│   │   ├── CreateTicketPage.jsx        # USER only
│   │   ├── TicketDetailPage.jsx        # Detail view with comments + attachments
│   │   └── TicketManagePage.jsx        # ADMIN management panel
├── components/
│   ├── tickets/
│   │   ├── TicketCard.jsx              # Ticket summary card
│   │   ├── TicketForm.jsx              # Create/edit form
│   │   ├── TicketStatusBadge.jsx       # Color-coded status pill
│   │   ├── TicketFilters.jsx           # Filter bar (status, priority, category)
│   │   ├── AttachmentUploader.jsx      # Drag-and-drop image uploader (max 3)
│   │   ├── AttachmentGallery.jsx       # Display uploaded images
│   │   ├── CommentSection.jsx          # Comment list + add comment
│   │   └── CommentItem.jsx             # Individual comment with edit/delete
│   └── shared/
│       ├── StatusTimeline.jsx          # Visual ticket workflow progress
│       └── RoleGuard.jsx              # Conditional render by role
├── services/
│   └── ticketService.js               # Axios calls to API
├── hooks/
│   └── useTickets.js                  # Custom hook for ticket data
└── context/
    └── AuthContext.jsx                # Current user + role
```

### Role-Based UI Rules
| Component/Action | USER | ADMIN | TECHNICIAN |
|---|---|---|---|
| Create ticket | ✅ | ✅ | ✅ |
| View own tickets | ✅ | — | — |
| View all tickets | — | ✅ | — |
| View assigned tickets | — | — | ✅ |
| Assign technician | — | ✅ | — |
| Reject ticket (with reason) | — | ✅ | — |
| Close ticket | — | ✅ | — |
| Update status to IN_PROGRESS | — | ✅ | ✅ (own) |
| Add resolution notes | — | — | ✅ (own) |
| Add comment | ✅ (own) | ✅ | ✅ (assigned) |
| Edit comment | Own only | Own only | Own only |
| Delete comment | Own only | ✅ (any) | Own only |

### Key UI Components to Build

**`AttachmentUploader.jsx`**
- Drag-and-drop zone accepting image files only
- Preview thumbnails before upload
- Counter showing `X / 3 images`
- Disable upload when 3 images reached

**`StatusTimeline.jsx`**
- Visual step indicator: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- Highlight current status; show REJECTED as a branch

**`TicketDetailPage.jsx`** (most complex page)
- Ticket info + status badge at top
- Attachment gallery (lightbox on click)
- Assigned technician display (ADMIN can change)
- Admin action panel: Assign, Reject (with reason modal), Close
- Technician action panel: Update status, Add resolution notes
- Comment section at the bottom

---

## 6. Implementation Checklist

### Backend
- [ ] Entity classes: `Ticket`, `TicketAttachment`, `TicketComment` with JPA annotations
- [ ] Enums: `TicketStatus`, `TicketPriority`, `TicketCategory`
- [ ] JPA Repositories with custom queries (filter by status, assigned user, reporter)
- [ ] `TicketService` — full CRUD + status transition logic + ownership checks
- [ ] `AttachmentService` — file upload, max-3 validation, safe storage, URL generation
- [ ] `CommentService` — add/edit/delete with author ownership enforcement
- [ ] Controllers with `@Valid`, correct HTTP methods, and proper status codes
- [ ] `@PreAuthorize` or custom security checks on each endpoint
- [ ] Global exception handler (`@ControllerAdvice`) returning structured error JSON
- [ ] Unit tests for service layer (status transitions, attachment limits, comment ownership)
- [ ] Postman collection covering all 14+ endpoints

### Frontend
- [ ] `ticketService.js` — all Axios API calls with auth headers
- [ ] `CreateTicketPage` — form with validation + attachment uploader
- [ ] `TicketListPage` — paginated table with filter bar, role-aware data fetch
- [ ] `TicketDetailPage` — full detail with comments, attachments, and action panels
- [ ] `AttachmentUploader` — preview, max-3 enforcement, image-only validation
- [ ] `CommentSection` — post comment, edit/delete with ownership gating
- [ ] `StatusTimeline` — visual workflow component
- [ ] Role-based route guards (`<RoleGuard role="ADMIN">`)
- [ ] Responsive design (usable on tablet/desktop)
- [ ] Error handling (API errors shown to user gracefully)

---

## 7. Marking Rubric Alignment

| Rubric Criterion | How Module C Covers It |
|---|---|
| **Proper Endpoint Naming** (5 marks) | RESTful paths: `/api/v1/tickets`, `/api/v1/tickets/{id}/comments`, etc. |
| **Six REST Architectural Styles** (10 marks) | Stateless JWT, uniform interface, layered architecture, correct cacheable responses |
| **HTTP Methods & Status Codes** (10 marks) | GET/POST/PUT/PATCH/DELETE used correctly; full status code set |
| **Code Quality** (5 marks) | Layered architecture, DTO pattern, `@Valid`, naming conventions, Javadoc |
| **Satisfying All API Requirements** (5 marks) | All ticket, attachment, and comment endpoints implemented with auth & validation |
| **React Architecture** (5 marks) | Modular components, custom hooks, service layer, context |
| **UI Feature Coverage** (5 marks) | All workflows implemented: create, view, status update, assign, comment |
| **UI/UX** (10 marks) | Status timeline, role-aware UI, image previews, filter/search, clear navigation |
| **Creativity** (10 marks, group) | Optional: SLA timer, ticket analytics, real-time comment updates |

---

## 8. Quick API Request/Response Examples

### Create Ticket — `POST /api/v1/tickets`
**Request:**
```json
{
  "title": "Projector not working in Lab 3",
  "category": "EQUIPMENT",
  "description": "The projector turns on but shows no image. Tried different cables.",
  "priority": "HIGH",
  "resourceId": "res-007",
  "contactName": "Amal Perera",
  "contactEmail": "amal@student.sliit.lk"
}
```
**Response `201`:**
```json
{
  "id": "tkt-123",
  "status": "OPEN",
  "createdAt": "2026-04-23T10:30:00Z",
  ...
}
```

### Update Status — `PATCH /api/v1/tickets/{id}/status`
**Request (ADMIN/TECHNICIAN):**
```json
{ "status": "IN_PROGRESS" }
```

### Reject Ticket — `PATCH /api/v1/tickets/{id}/status`
**Request (ADMIN only):**
```json
{ "status": "REJECTED", "reason": "Duplicate ticket — see #tkt-118" }
```

### Resolve Ticket — `PATCH /api/v1/tickets/{id}/resolve`
**Request (TECHNICIAN):**
```json
{ "resolutionNotes": "Replaced HDMI cable. Projector now working correctly." }
```

### Add Comment — `POST /api/v1/tickets/{id}/comments`
**Request:**
```json
{ "content": "Has this been looked at yet? The lab is needed tomorrow." }
```

---

## 9. Suggested Development Order

1. **Entities + Enums + Repositories** — set up DB schema first
2. **TicketService + TicketController** — core CRUD without attachments
3. **AttachmentService + Controller** — file upload plumbing
4. **CommentService + Controller** — comments with ownership rules
5. **Security layer** — role guards on all endpoints
6. **Unit tests + Postman collection**
7. **React: `ticketService.js` + `CreateTicketPage`** — end-to-end create flow
8. **React: `TicketListPage`** — list with filters
9. **React: `TicketDetailPage`** — the big one (comments, attachments, actions)
10. **Polish:** error handling, loading states, responsive layout

---

*Plan prepared for IT3030 PAF 2026 — Module C (Maintenance & Incident Ticketing)*  
*Roles: USER · ADMIN · TECHNICIAN | Stack: Spring Boot + React*
