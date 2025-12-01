'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CalendarSyncStatus {
  enabled: boolean;
  status: 'active' | 'failed' | 'disconnected' | null;
  lastSyncAt: string | null;
  lastError: string | null;
}

interface CalendarSyncSettingsProps {
  organizationId: string;
  organizationName: string;
}

export function CalendarSyncSettings({
  organizationId,
  organizationName,
}: CalendarSyncSettingsProps) {
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organization/${organizationId}/calendar-sync`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('You are not a member of this organization');
          return;
        }
        throw new Error('Failed to fetch sync status');
      }

      const data = await response.json();
      setMembershipId(data.membershipId);
      setSyncStatus(data.calendarSync);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar sync status');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // Check for success/error query params from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar_connected') === 'true') {
      // Refresh status after successful connection
      fetchSyncStatus();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('calendar_error') === 'true') {
      setError(params.get('message') || 'Failed to connect Google Calendar');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchSyncStatus]);

  const handleConnect = () => {
    if (!membershipId) return;
    
    // Redirect to OAuth flow
    const redirect = encodeURIComponent(`/organizations/${organizationId}/settings`);
    window.location.href = `/api/calendar/connect?membership_id=${membershipId}&redirect=${redirect}`;
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar sync for this organization?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`/api/organization/${organizationId}/calendar-sync`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect calendar');
      }

      // Refresh status
      await fetchSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect calendar');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!syncStatus || !syncStatus.status) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Not connected
        </span>
      );
    }

    switch (syncStatus.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Active
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            Failed - Reconnection needed
          </span>
        );
      case 'disconnected':
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Disconnected
          </span>
        );
      default:
        return null;
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Sync
          </CardTitle>
          <CardDescription>Loading sync status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar Sync
        </CardTitle>
        <CardDescription>
          Automatically sync events from {organizationName} to your Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Status Section */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            
            {syncStatus?.status === 'active' && syncStatus.lastSyncAt && (
              <div className="text-right">
                <p className="text-sm font-medium">Last Synced</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatLastSync(syncStatus.lastSyncAt)}
                </p>
              </div>
            )}
          </div>

          {/* Error Message for Failed Sync */}
          {syncStatus?.status === 'failed' && syncStatus.lastError && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Sync failed</p>
                <p className="text-yellow-700 dark:text-yellow-500">{syncStatus.lastError}</p>
                <p className="mt-1">Please reconnect your Google Calendar to resume syncing.</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="text-sm text-muted-foreground">
            {syncStatus?.status === 'active' ? (
              <p>
                When admins or owners create, update, or delete events in this organization,
                they will automatically be synced to your Google Calendar.
              </p>
            ) : (
              <p>
                Connect your Google Calendar to automatically receive event updates from this
                organization. Events will be added, updated, and removed in real-time.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {!syncStatus?.status || syncStatus.status === 'disconnected' ? (
              <Button
                onClick={handleConnect}
                disabled={!membershipId || actionLoading}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Connect Google Calendar
              </Button>
            ) : syncStatus.status === 'failed' ? (
              <>
                <Button
                  onClick={handleConnect}
                  disabled={!membershipId || actionLoading}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reconnect Calendar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={actionLoading}
                  className="gap-2"
                >
                  <Unlink className="h-4 w-4" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                Disconnect Calendar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
