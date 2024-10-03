import React from "react";

const ClientDetailPage = ({ params }: { params: { id: string } }) => {
  return <div>{params.id}</div>;
};

export default ClientDetailPage;
