import { Navigate, useParams } from "react-router-dom";

const NavigateToComplex = () => {
  const { slug } = useParams<{ slug: string }>();

  return <Navigate to={slug ? `/complexe/${slug}` : "/complexe"} replace />;
};

export default NavigateToComplex;