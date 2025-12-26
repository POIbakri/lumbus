# Notification Scripts

Scripts for sending push notifications to users.

## Available Scripts

### 1. Broadcast Notification
Send a notification to ALL users with push tokens.

```bash
npx tsx scripts/notifications/broadcast.ts "Title" "Message body"
```

### 2. Remind Uninstalled eSIMs
Notify users who have eSIMs ready but haven't installed them yet.

```bash
# Preview who would be notified
npx tsx scripts/notifications/remind-uninstalled-esims.ts --dry-run

# Send notifications
npx tsx scripts/notifications/remind-uninstalled-esims.ts
```

### 3. Remind No Usage
Notify users who have activated eSIMs but haven't used any data (0% usage).

```bash
# Preview who would be notified
npx tsx scripts/notifications/remind-no-usage.ts --dry-run

# Send notifications
npx tsx scripts/notifications/remind-no-usage.ts
```

## Usage Tips

- Always use `--dry-run` first to preview who would be notified
- Scripts only send to users who have push tokens registered
- Each script logs success/failure counts

## Notification Types

| Type | Channel (Android) | Category (iOS) |
|------|------------------|----------------|
| esim_ready | esim-ready | esim_ready |
| usage_alert | usage-alerts | usage_alert |
| app_update | default | - |
