import { Navigate, useParams } from "@/lib/router-compat";

const OfertaRedirect = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/proprietati/${id}`} replace />;
};

export default OfertaRedirect;
