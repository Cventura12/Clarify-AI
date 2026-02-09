export type CalendarSyncResult = {
  synced: number;
  message: string;
};

export async function syncGoogleCalendar(): Promise<CalendarSyncResult> {
  return {
    synced: 3,
    message: "Mock calendar sync complete."
  };
}
