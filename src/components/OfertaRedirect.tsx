import { Navigate, useParams } from "react-router-dom";

const OfertaRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/proprietati/${id}`} replace />;
};

export default OfertaRedirect;
