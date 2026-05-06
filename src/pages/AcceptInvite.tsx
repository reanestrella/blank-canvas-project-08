import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) return;

    console.log("SALVANDO TOKEN:", token);

    // 🔥 SALVA NOS DOIS
    sessionStorage.setItem("pending_invite_token", token);
    localStorage.setItem("pending_invite_token", token);
  }, [token]);

  if (!token) return <p>Convite inválido</p>;

  return (
    <div style={{ textAlign: "center", marginTop: 100 }}>
      <h2>Você foi convidado 🎉</h2>

      <button onClick={() => navigate("/login")} style={{ margin: 10 }}>
        Já tenho conta
      </button>

      <button onClick={() => navigate("/registro?invite=true")} style={{ margin: 10 }}>
        Criar conta
      </button>
    </div>
  );
}
