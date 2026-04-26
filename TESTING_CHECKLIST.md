# Module C Testing Checklist ✅

## 🎯 System Status

| Component | Status | Port | Notes |
|-----------|--------|------|-------|
| **Backend (Spring Boot)** | ✅ Running | 8080 | API context: `/api` |
| **Frontend (React)** | ✅ Running | 3000 | Compiled successfully |
| **MongoDB** | ✅ Connected | N/A | Atlas cluster active |
| **Cloudinary** | ✅ Configured | N/A | Image upload ready |

---

## 🧪 Testing Instructions

### Step 1: Access Frontend
```
URL: http://localhost:3000
```

### Step 2: Login
- Use existing credentials or create new account
- Ensure JWT token is stored in localStorage

### Step 3: Create Test Ticket

**Navigate to**: Sidebar → "Maintenance Tickets" → "Create Ticket"

**Fill Form**:
- [ ] Title: (e.g., "Broken projector in Room 205")
- [ ] Category: Select from dropdown
  - [ ] ELECTRICAL
  - [ ] EQUIPMENT  
  - [ ] NETWORK/IT
  - [ ] STRUCTURAL
  - [ ] OTHER
- [ ] Description: Type description
  - [ ] AI suggestion should appear automatically
  - [ ] Click "Apply" to use suggestion
- [ ] Priority: Select (affects SLA)
- [ ] Contact Name: Enter name
- [ ] Contact Email: Enter valid email
- [ ] Images: Upload 1-3 images (optional)

**Expected Results**:
- ✅ No JSON deserialization error
- ✅ Categories dropdown shows new values
- ✅ AI suggestion triggers on description
- ✅ Form submits successfully
- ✅ Redirects to ticket details page

### Step 4: View My Tickets

**Navigate to**: Sidebar → "Maintenance Tickets" → "My Tickets"

**Expected Results**:
- ✅ List loads without error
- ✅ Created ticket appears in list
- ✅ Statistics show correct counts
- ✅ Can filter by status
- ✅ Can search by title
- ✅ Can sort tickets

### Step 5: View Ticket Details

**Click**: "View Details" on any ticket

**Expected Results**:
- ✅ Full ticket information displays
- ✅ Category shows correct value
- ✅ SLA countdown displays
- ✅ Comments section works
- ✅ Can add comments
- ✅ Can upload attachments

### Step 6: Admin Features (if admin user)

**Navigate to**: Sidebar → "Maintenance Tickets" → "All Tickets (Admin)"

**Expected Results**:
- ✅ Admin dashboard loads
- ✅ Statistics display correctly
- ✅ Priority distribution chart shows
- ✅ Can filter by status
- ✅ Can filter by priority
- ✅ Can search tickets
- ✅ Grid/Table view toggle works
- ✅ Can update ticket status

---

## ✅ Verification Checklist

### Backend Verification

```bash
# Check Backend Logs
# Expected: No ClassCastException errors
# Expected: No TicketCategory deserialization errors
# Expected: Requests to /v1/tickets/my succeed
```

**Backend Errors to Look For** (should NOT appear):
- ❌ `ClassCastException: cannot be cast to class com.university.entity.User`
- ❌ `Cannot deserialize value of type TicketCategory from String`
- ❌ `No static resource v1/tickets`

### Frontend Verification

**Category Dropdown** (CreateTicketPage):
- [ ] Shows 5 options (ELECTRICAL, EQUIPMENT, NETWORK, STRUCTURAL, OTHER)
- [ ] No more PLUMBING, HVAC, IT, CLEANING options

**AI Suggestion**:
- [ ] Type "electrical" in description → Suggests ELECTRICAL
- [ ] Type "network" in description → Suggests NETWORK
- [ ] Type "equipment" in description → Suggests EQUIPMENT
- [ ] Type "wall crack" in description → Suggests STRUCTURAL

---

## 🚨 Common Issues & Solutions

### Issue: "Categories not updated in dropdown"
**Solution**: Hard refresh browser (Ctrl+Shift+R) to clear cache

### Issue: "Still getting deserialization error"
**Solution**: 
1. Ensure backend is running latest build
2. Check backend logs for errors
3. Restart backend: Kill maven process and run again

### Issue: "Authentication error when creating ticket"
**Solution**:
1. Clear localStorage: `localStorage.clear()`
2. Refresh page and login again
3. Verify token is stored in localStorage as `auth_profile`

### Issue: "Cannot find user when getting my tickets"
**Solution**:
1. Verify UserRepository.findByUsername() is being called
2. Check database has user record
3. Verify token contains correct username

---

## 📊 Database Records to Check

**MongoDB Collections**:
- `user` - Should have logged-in user record
- `ticket` - Should have created ticket with correct category
- `ticketattachment` - Should have uploaded images
- `ticketcomment` - Should have added comments

**Verify Category Values** (not PLUMBING, HVAC, IT, CLEANING):
```javascript
db.ticket.find({ "category": "EQUIPMENT" })  // Should find tickets
db.ticket.find({ "category": "IT" })         // Should return empty
```

---

## 🎯 Success Criteria

✅ **All of the following must be true**:

1. **Frontend**:
   - [ ] Categories dropdown shows: ELECTRICAL, EQUIPMENT, NETWORK, STRUCTURAL, OTHER
   - [ ] Can create ticket without errors
   - [ ] Can view my tickets list
   - [ ] Can view ticket details
   - [ ] AI suggestion works with new keywords

2. **Backend**:
   - [ ] No ClassCastException errors
   - [ ] No TicketCategory deserialization errors
   - [ ] All /v1/tickets endpoints respond correctly
   - [ ] User lookup works properly
   - [ ] Tickets saved with correct categories

3. **Admin Features** (if applicable):
   - [ ] Admin dashboard loads
   - [ ] Can view all tickets
   - [ ] Can update ticket status
   - [ ] Category filtering works
   - [ ] Priority filtering works

4. **Database**:
   - [ ] Tickets stored with valid category enum values
   - [ ] All relationships (user, technician) resolve correctly
   - [ ] Comments and attachments associated properly

---

## 📝 Test Results Template

```markdown
## Test Results - [DATE]

### Create Ticket Test
- Status: PASS / FAIL
- Category Used: [ELECTRICAL/EQUIPMENT/NETWORK/STRUCTURAL/OTHER]
- Errors: [None/List errors]

### My Tickets Test
- Status: PASS / FAIL
- Tickets Loaded: [Number]
- Errors: [None/List errors]

### Details Page Test
- Status: PASS / FAIL
- Comments Work: YES/NO
- SLA Display: YES/NO
- Errors: [None/List errors]

### Admin Dashboard Test
- Status: PASS / FAIL (N/A if not admin)
- Filter Works: YES/NO
- Chart Displays: YES/NO
- Errors: [None/List errors]

### Overall Result
- ✅ PASS - All features working
- ❌ FAIL - [List issues]
```

---

## 📞 Support

If issues occur:

1. **Check logs** - Backend logs show exact error
2. **Review fixes** - Read CRITICAL_FIXES_APPLIED.md
3. **Verify files** - Confirm backend TicketController.java has UserRepository
4. **Verify files** - Confirm frontend TicketForm.jsx has new categories
5. **Clear cache** - Hard refresh browser (Ctrl+Shift+R)
6. **Restart backend** - Kill and restart mvn process
7. **Restart frontend** - Kill and restart npm start

---

## 🎉 Completion

When all tests pass:

✅ Module C is **fully functional**  
✅ All critical issues **resolved**  
✅ System is **production ready**  

Document results and commit code changes to version control.

---

**Testing Date**: April 25, 2026  
**Test Environment**: Windows 11, Node 22.16.0, Java 17.0.12  
**Status**: Ready for Verification
