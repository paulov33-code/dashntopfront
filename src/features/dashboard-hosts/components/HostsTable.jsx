import { Table } from "../../../components/ui/Table";

export const HostsTable = ({ hosts }) => {
  // Definimos las columnas y cómo se renderiza cada celda de forma limpia
  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Hostname", accessor: "hostname" },
    { header: "Dirección IP", accessor: "ip" },
    { header: "Sistema Operativo", accessor: "os" },
    { 
      header: "Estado", 
      cell: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.status === 'activo' ? 'bg-green-100 text-green-800' : 
          row.status === 'desconocido' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.status}
        </span>
      )
    },
  ];

  return <Table columns={columns} data={hosts} />;
};