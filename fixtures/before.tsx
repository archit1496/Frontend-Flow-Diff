import React from 'react';
import { Link } from 'react-router-dom';

export function UserProfile() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [items, setItems] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch('/api/users/me').then(r => r.json()).then(setItems);
  }, []);

  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <Link to="/settings">Settings</Link>
      <button>Save</button>
      {items.length === 0 && <p>No items</p>}
    </div>
  );
}
