import { Navigate, useParams } from "@/lib/router-compat";

const NavigateToComplex = () => {
  const { slug } = useParams<{ slug: string }>();

  return <Navigate to={slug ? `/complexe/${slug}` : "/complexe"} replace />;
};

export default NavigateToComplex;