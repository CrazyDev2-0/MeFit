import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
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
  Input,
  HStack,
  Checkbox,
  Select,
  Text
} from "@chakra-ui/react";

import Swal from "sweetalert2";

const BASEURL = 'https://stratathonapi.tanmoy.codes';

const SetupPersonalizedMonitoringModal = ({ patientId, disclosure }) => {
  const [allDiseases, setAllDiseases] = useState([]);
  const [allModels, setAllModels] = useState([]);
  const [allVitals, setAllVitals] = useState([]);

  const [configuredVitals, setConfiguredVitals] = useState([]);

  
  const [stepchk, setStepchk] = useState(false);
  const [calchk, setCalchk] = useState(false);
  const cntRef = useRef({
    name: "",
    description: "",
    intervalSeconds: "",
    predictionModelId: "-1",
    minStepCount: 0,
    minCalorieCount: 0,
  });
  const getAllModels = async () => {
    const data = await axios({
      method: 'get',
      url: `${BASEURL}/doctor/monitoring/prediction-models`,
      headers: { 
          'authorization': localStorage.getItem('token')
        }
    });
    setAllModels(data.data.payload);
  }
  const getAllDiseases = async () => {
    const data = await axios({
      method: 'get',
      url: `${BASEURL}/doctor/disease/all`,
      headers: { 
          'authorization': localStorage.getItem('token')
        }
    });
    setAllDiseases(data.data.payload);
  }

  const getAllVitals = async()=>{
    var vitalRaw = localStorage.getItem("vitalInfo");
    var vitalJson = JSON.parse(vitalRaw);
    setAllVitals(vitalJson);
  }

  const tryparseint = (val) => {
    
    try {
      var tmp = parseInt(val);
      if(tmp.toString() === "NaN") return 0;
      return tmp;
    } catch (error) {
      return 0;
    }
  }

  const addNewVitalThreshold = ()=>{
    setConfiguredVitals([...configuredVitals, {
      "vitalId" : "",
      "min" : 0,
      "max" : 0,
      "threshold" : 0,
      "isNegativeThreshold" : false,
      "longTermMonitoringRequired" : false,
      "rate" : 0.0
    }]);
  }

  const submitForm = async ()=>{
    console.table(configuredVitals);
    let tmpdata = cntRef.current;
    tmpdata["vitalThresholds"] = configuredVitals;

    tmpdata["patientId"] = patientId;

    if(tmpdata.minStepCount > 0){
      tmpdata["isMonitorStepCount"] = true;
    }else{
      tmpdata["isMonitorStepCount"] = false;
    }

    if(tmpdata.minCalorieCount > 0){
      tmpdata["isMonitorCalorieCount"] = true;
    }else{
      tmpdata["isMonitorCalorieCount"] = false;
    }

    if(tmpdata.predictionModelId === "-1"){
      tmpdata["isPredictionModelAssigned"] = false;
      delete tmpdata["predictionModelId"];
    }else{
      tmpdata["isPredictionModelAssigned"] = true;
    }

    try {
      document.showLoadingScreen();
      console.log(tmpdata);
      const res = await axios({
        method: 'post',
        url: `${BASEURL}/doctor/monitoring/setup`,
        headers: { 
            'authorization': localStorage.getItem('token'), 
            'Content-Type': 'application/json'
          },
          data: JSON.stringify(tmpdata)
      });
      let resJSon = res.data;
      disclosure.onClose();
      document.hideLoadingScreen()
      Swal.fire(
        resJSon.success ? "Successfully Assigned " : "Error",
        resJSon.message,
        resJSon.success ? 'success' : "error"
      )
      
    } catch (error) {
      console.log(error);
      document.hideLoadingScreen();
      Swal.fire(
        "Error",
        "Some error occured...",
        "error"
      )
    }
  }

  useEffect(() => { 
    getAllDiseases();
    getAllModels();
    getAllVitals();
  }, []);
  
  return (
    <>
      <Modal
        isOpen={disclosure.isOpen}
        onClose={disclosure.onClose}
        size="xl"
        isCentered>
        <ModalOverlay
          bg='blackAlpha.300'
          backdropFilter='blur(10px) hue-rotate(90deg)'
        />
        <ModalContent>
          <ModalHeader>Setup Personalize Monitoring</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl pb={5} >
              <FormLabel>Enter Title</FormLabel>
              <Input placeholder="i.e Heart Rate Monitoring" onChange={(e)=>cntRef.current.name=e.target.value}></Input>
            </FormControl>
            <FormControl pb={5}>
              <FormLabel>Description regarding monitoring (Not Mandatory)</FormLabel>
              <Input placeholder="description" onChange={(e)=>cntRef.current.description=e.target.value}></Input>
            </FormControl>
            <FormControl pb={5}>
              <FormLabel>Monitoring Interval (seconds)</FormLabel>
              <Input placeholder="Enter monitoring time interval" type="number" onChange={(e)=>cntRef.current.intervalSeconds=tryparseint(e.target.value)}></Input>
            </FormControl>
            <HStack pb={6}>
              <FormControl>
                <FormLabel>Disease (Not mandatory)</FormLabel>
                <Select>
                  <option selected disabled>Select</option>
                  {allDiseases.map(elem => <option value={elem.id}>{elem.name}</option>)}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>AI Model (Not mandatory)</FormLabel>
                <Select onChange={(e)=>cntRef.current.predictionModelId=e.target.value}>
                  <option selected disabled>Select</option>                  
                  {allModels.map(elem => <option value={elem.id}>{elem.name}</option>)}
                </Select>
              </FormControl>
            </HStack>
            <HStack pb={5}>
              <Checkbox colorScheme="green" mr="auto" checked={stepchk} onChange={(e)=>setStepchk(e.target.checked)}>Step Count Monitor</Checkbox>
              <Input placeholder="Taget count" width="45%" disabled={!stepchk} onChange={(e) => {cntRef.current["minStepCount"] = tryparseint(e.target.value); }} ></Input>
            </HStack>
            <HStack pb={5}>
              <Checkbox colorScheme="green" mr="auto" checked={calchk} onChange={(e)=>setCalchk(e.target.checked)}>Calorie Burnt Monitor</Checkbox>
              <Input placeholder="Target count" width="45%" disabled={!calchk} onChange={(e) => {cntRef.current["minCalorieCount"] = tryparseint(e.target.value); }} ></Input>
            </HStack>
            <Text mb={5}>Choose Vitals to set threshold</Text>
            {/* Vital threhsolds */}
            {configuredVitals.map((elem, i) => <HStack>
              <Select onChange={(e)=>configuredVitals[i].vitalId=e.target.value}>
                {allVitals.map(vital => <option value={vital.id} selected={elem.vitalId === vital.id} >{vital.name}</option>)}
              </Select>
              <Input placeholder="Min" type="number" onChange={(e)=>configuredVitals[i].min=(e.target.value)}></Input>
              <Input placeholder="Max" type="number" onChange={(e)=>configuredVitals[i].max=(e.target.value)}></Input>
              <Input placeholder="Threshold" type="number" onChange={(e)=>configuredVitals[i].threshold=(e.target.value)}></Input>
              <Checkbox colorScheme="green" mr="auto" value={elem.isNegativeThreshold} onChange={(e)=>configuredVitals[i].isNegativeThreshold=e.target.checked}>Negative</Checkbox>
            </HStack>
          )}
          <Button mt={15} onClick={addNewVitalThreshold}>Add new vital</Button>
          </ModalBody>
          <ModalFooter>
            <Button onClick={disclosure.onClose} mr={3}>Dismiss</Button>
            <Button colorScheme="orange" onClick={submitForm}>Submit</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};


export default SetupPersonalizedMonitoringModal;