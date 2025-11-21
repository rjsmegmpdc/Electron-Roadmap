# ADO Integration Testing Guide

This document outlines how to test the corrected Azure DevOps integration with proper PAT token validation and expiry date management.

## Fixed Issues

### 1. PAT Token Validation ✅
**Previous Issue**: Used incorrect regex pattern that only accepted exactly 52 characters
**Fix Applied**: Updated `EncryptionService.validateTokenFormat()` to:
- Accept tokens 20-88 characters long (Microsoft specification)
- Use proper base64url character set validation: `[A-Za-z0-9_-]`
- Added detailed validation error messages
- Added checks for common invalid patterns (all zeros, placeholder text, etc.)

### 2. Expiry Date Management ✅ 
**New Feature**: Added PAT token expiry date tracking
- Automatically sets 90-day expiry from creation date
- User can choose shorter periods only (not longer for security)
- Shows expiry status in configuration list
- Visual indicators for expired/expiring soon tokens

### 3. Development Mode Display ✅
**New Feature**: PAT tokens are unmasked in development mode
- Shows `[DEV: Unmasked]` indicator in form labels
- Uses `type="text"` instead of `type="password"` in dev mode
- Real-time validation with visual feedback

## Testing Steps

### Step 1: Database Migration Test
1. Run the application 
2. Check console for migration message: "Added pat_token_expiry_date column to ado_config table"
3. Verify database schema version updated to 5

### Step 2: PAT Token Validation Test

#### Valid Token Test Cases:
```
Valid Azure DevOps PAT tokens to test:
- 52 characters: abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN
- 44 characters: abcdefghijklmnopqrstuvwxyz0123456789ABCDEF
- With underscores: abc_def_ghi_jkl_mnop_qrst_uvwx_yz01_2345_6789
- With hyphens: abc-def-ghi-jkl-mnop-qrst-uvwx-yz01-2345-6789
```

#### Invalid Token Test Cases:
```
These should show validation errors:
- Too short: abc123 (shows "PAT token is too short")
- Invalid chars: abc123@#$ (shows "contains invalid characters")
- All zeros: 0000000000000000000000000000000000000000000000000000
- Placeholder: "your-token-here" (shows "appears to contain placeholder text")
```

### Step 3: Expiry Date Functionality Test

#### Automatic Default Test:
1. Click "New Configuration"
2. Verify expiry date field is pre-populated with date 90 days from today
3. Verify the helper text shows the default date

#### Date Validation Test:
1. Try to set expiry date to yesterday → Should show error
2. Try to set expiry date to today → Should work
3. Try to set expiry date to 30 days from now → Should work
4. Try to set expiry date to 365 days from now → Should work (user can choose longer)

### Step 4: Visual Feedback Test

#### Development Mode:
1. In development mode, PAT token field should show `[DEV: Unmasked]`
2. Text should be visible as you type
3. Real-time validation messages should appear:
   - "Validating token format..." while typing
   - Green checkmark for valid tokens
   - Red warning for invalid tokens

#### Production Mode:
1. In production build, PAT token field should be masked (password type)
2. Same validation feedback should work

### Step 5: Configuration List Display Test

After creating configurations, verify the list shows:
- 🔒 "Token Expired" for expired tokens (red text)
- ⚠ "Expires Soon" for tokens expiring within 7 days (orange text)
- "Token: Xd left" for tokens with longer expiry (gray text)

## Test Data for Manual Testing

### Test Organization Setup:
- **Org URL**: `https://dev.azure.com/your-test-org`
- **Project Name**: `TestProject`
- **Valid PAT Token**: Generate a real one from ADO or use format: `abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMN`

### Expected Behavior:
1. **Token Creation**: Should accept valid tokens with expiry date
2. **Token Update**: Should allow updating token and/or expiry date
3. **Expiry Warnings**: Should show visual indicators for expiring tokens
4. **Validation**: Should provide clear error messages for invalid tokens

## Database Schema Verification

Check that the `ado_config` table includes the new column:
```sql
PRAGMA table_info(ado_config);
-- Should show pat_token_expiry_date column
```

## Error Handling Test Cases

1. **Invalid token format** → Clear validation message
2. **Past expiry date** → "PAT Token expiry date cannot be in the past"
3. **Missing required fields** → Appropriate field-specific errors
4. **Database connection issues** → Graceful error handling

## Success Criteria

✅ PAT token validation accepts Microsoft-compliant tokens
✅ Expiry date defaults to 90 days from creation
✅ User can set shorter expiry periods
✅ Tokens are unmasked in development mode
✅ Real-time validation provides clear feedback
✅ Configuration list shows expiry status
✅ Database migration adds expiry column successfully
✅ All IPC handlers work correctly
✅ Error messages are user-friendly and specific

## Next Steps After Testing

If tests pass:
1. Test with real Azure DevOps API calls
2. Verify webhook functionality still works
3. Test with actual PAT tokens from Azure DevOps
4. Implement token refresh reminders
5. Add import/export functionality for team sharing