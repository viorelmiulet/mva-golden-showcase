import { Navigate, useParams } from "react-router-dom";

const OfertaRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/proprietate/${id}`} replace />;
};

export default OfertaRedirect;
