type AuthUserForRedirect = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  hasCompletedOnboarding?: boolean;
};

/** Stores onboarding session data required by the standalone preferences flow. */
function storeOnboardingUser(user: AuthUserForRedirect) {
  if (!user.id || !user.email || !user.name) {
    return;
  }

  sessionStorage.setItem('newUserData', JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
  }));
}

/** Chooses where an authenticated user should land after login. */
export function getPostLoginRedirect(user: AuthUserForRedirect | null | undefined) {
  if (!user) {
    return '/';
  }

  const isStudent = user.role !== 'admin';
  if (isStudent && user.hasCompletedOnboarding === false) {
    storeOnboardingUser(user);
    return '/preferences';
  }

  sessionStorage.removeItem('newUserData');
  return '/';
}
