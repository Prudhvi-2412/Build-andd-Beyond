import React, { useEffect, useState } from "react";
import "./CompanyEmployees.css";
import EmployeesHeader from "./components/EmployeesHeader";
import EmployeesGrid from "./components/EmployeesGrid";
import LoadingOrEmpty from "./components/LoadingOrEmpty";

const CompanyEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/my-employees", {
      method: "GET",
      credentials: "include"
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data.employees || []);
      })
      .catch((err) => console.error("Employees API error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="comEmp_container">
      <EmployeesHeader />
      <LoadingOrEmpty loading={loading} employeesLength={employees.length} />
      {!loading && employees.length > 0 && <EmployeesGrid employees={employees} />}
    </div>
  );
};

export default CompanyEmployees;
