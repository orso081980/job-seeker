import { useEffect, useState } from "react";
import { api } from "../api/client";

export function useAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    api
      .session()
      .then((s) => setAuthed(s.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  const login = async (username: string, password: string) => {
    await api.login(username, password);
    setAuthed(true);
  };

  const logout = async () => {
    await api.logout();
    setAuthed(false);
  };

  return { authed, login, logout };
}
