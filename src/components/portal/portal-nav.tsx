'use client';

import React from 'react';
import { UserProfile } from '@/lib/types/portal';

export interface PortalNavProps {
  user: UserProfile;
}

/**
 * PortalNav is retired as a secondary header.
 * All portal navigation, branding, badges, user profile info, and logout
 * are now unified inside the primary top <Header /> component,
 * completely eliminating the double-header issue in the portal.
 */
export function PortalNav(_props: PortalNavProps) {
  return null;
}
