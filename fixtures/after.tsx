import React from 'react';
import { Link } from 'react-router-dom';

export function UserProfile() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [items, setItems] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch('/api/users/me/preferences').then(r => r.json()).then(setItems);
  }, []);

  if (isLoading) return <div className="skeleton">Loading...</div>;
  return (
    <div>
      <Link to="/account/settings">Settings</Link>
      <button>Save changes</button>
      {items.length === 0 && <p>No items yet</p>}
    </div>
  );
}
