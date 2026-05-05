import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");

    console.log("TOKEN CAPTURADO:", token);

    if (token) {
      // salva corretamente
      sessionStorage.setItem("pending_invite_token", token);

      // redireciona pro login
      navigate("/login");
    } else {
      navigate("/");
    }
  }, []);

  return <p>Processando convite...</p>;
}
