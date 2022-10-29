import React, { useEffect, useState } from "react";
import axios from 'axios';

import Swal from "sweetalert2";

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  IconButton,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import PatientSearchModal from "../components/patientSearchModal";
import PatientAccessRequestModal from "../components/patientAccessRequest";
import { useNavigate } from "react-router-dom";

const BASEURL = 'https://stratathonapi.tanmoy.codes';
const PatientListPage = () => {

  const navigate = useNavigate();
  const modalUseDisclosureForSearchModal = useDisclosure();
  const modalUseDisclosureForNewPatientModal = useDisclosure();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [patients, setPatients] = useState([]);

  const formRef = React.useRef({
    patientName: "",
    email: "",
  });

  // Change pages
  function goToAPage(pageNo) {
    // studentDatabaseManage.current.setCurrentPage(pageNo);
    // setStudents(studentDatabaseManage.current.getStudents());
    // setTotalPages(studentDatabaseManage.current.totalPages);
    // setCurrentPage(studentDatabaseManage.current.currentPage);
  }

  const getall = async () => {
    const data = await axios({
        method: 'get',
        url: `${BASEURL}/doctor/patients/all`,
        headers: { 
            'authorization': localStorage.getItem('token')
          }
    });
    // console.log(data.data.payload)
    // console.log(data.data.payload[0].id)
    setPatients(data.data.payload);
    console.log(data.data.payload);
  } 

  useEffect(() => { getall() }, []);

  return (
    <>
      <PatientSearchModal
        disclosure={modalUseDisclosureForSearchModal}
        formRef={formRef}
        searchPatientOnClick={(e) => {}}
      />
      <PatientAccessRequestModal
        disclosure={modalUseDisclosureForNewPatientModal}
        formRef={formRef}
        requestOnClick={async (e) => { 
          console.log(formRef.current.email); 
          try {
            modalUseDisclosureForNewPatientModal.onClose();
            const res = await axios({
              method: 'post',
              url: `${BASEURL}/doctor/patients/request`,
              headers: { 
                  'authorization': localStorage.getItem('token'), 
                  'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                  email: formRef.current.email
                })
            });
            let resJSon = res.data;
            modalUseDisclosureForNewPatientModal.onClose();
            document.hideLoadingScreen()
            Swal.fire(
              resJSon.success ? "Successfully Sent " : "Error",
              resJSon.message,
              resJSon.success ? 'success' : "error"
            )
            
          } catch (error) {
            console.log(error);
            Swal.fire(
              "Error",
              "Email not found",
              "error"
            )
            document.hideLoadingScreen();
          }
          
        }}
      />

      <div className="patientListResult">
        <div className="header">
          <p>Patient Database</p>
          <HStack>
            {/* <Button
              onClick={modalUseDisclosureForSearchModal.onOpen}
              colorScheme="orange"
            >
              Search
            </Button> */}
            <Button
              onClick={modalUseDisclosureForNewPatientModal.onOpen}
              colorScheme="orange"
            >
              Add New Patient
            </Button>
          </HStack>
        </div>
        <TableContainer mt={5}>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Patient Name</Th>
                <Th>Age</Th>
                <Th>Sex</Th>
                <Th>E-mail</Th>
                <Th>View Stats</Th>
              </Tr>
            </Thead>
            <Tbody>
              {
                patients.map(patient => 
                <Tr key= {patient.id}>
                  <Td>{patient.id}</Td>
                  <Td>{patient.name}</Td>
                  <Td>{patient.profile.age}</Td>
                  <Td>{patient.profile.gender}</Td>
                  <Td>
                    <Button size="xs" colorScheme="orange">
                      {patient.email}
                    </Button>
                  </Td>
                  <Td>
                    <Button size="xs" colorScheme="orange" onClick={() => {navigate(`/patients/${patient.id}`, {replace: false});}}>
                      View Stats
                    </Button>
                  </Td>
                </Tr>)
              }
              
            </Tbody>
          </Table>
        </TableContainer>
        <div className="patientListResultFooter">
          <p>
            Page {currentPage} of {totalPages}
          </p>
          <HStack width="fit-content">
            {/* <IconButton
              colorScheme="orange"
              size="sm"
              icon={<FontAwesomeIcon icon={faAnglesLeft} />}
            /> */}
            {/* <IconButton
              colorScheme="orange"
              size="sm"
              icon={<FontAwesomeIcon icon={faAngleLeft} />}
            /> */}
            {[...Array(totalPages)].map((value, index) => (
              <IconButton
                key={index}
                colorScheme="orange"
                size="sm"
                onClick={() => goToAPage(index + 1)}
                icon={<p>{(index + 1).toString()}</p>}
              />
            ))}
            {/* <IconButton
              colorScheme="orange"
              size="sm"
              icon={<FontAwesomeIcon icon={faAngleRight} />}
            /> */}
            {/* <IconButton
              colorScheme="orange"
              size="sm"
              icon={<FontAwesomeIcon icon={faAnglesRight} />}
            /> */}
          </HStack>
        </div>
      </div>
    </>
  );
};

export default PatientListPage;
