import React from "react";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  FormControl,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormLabel,
  ModalFooter,
  Button,
  Input
} from "@chakra-ui/react";



const PatientSearchModal = ({ formRef, disclosure, searchPatientOnClick }) => {
  return (
    <>
      <Modal
        isOpen={disclosure.isOpen}
        onClose={disclosure.onClose}
        isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Search Patient</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl >
              <FormLabel><i>Enter name of patient</i></FormLabel>
              <Input placeholder="i.e Rahul Mondal" onChange={(e)=>formRef.current.patientName=e.target.value}></Input>              
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={disclosure.onClose} mr={3}>Dismiss</Button>
            <Button colorScheme="orange" onClick={searchPatientOnClick} >Search Patient</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};


export default PatientSearchModal;