import React, { useEffect, useState } from "react";
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Line } from "react-chartjs-2";

const BASEURL = 'https://stratathonapi.tanmoy.codes';
const CHARTSIZE = 50;

const Drawchart = ({vital, functionRef}) => {  
  const { id } = useParams();


  const options = {
    responsive: true,
    plugins: {
      legend: {
          display: false
      },
      title: {
        display: true,
        text: vital.name,
      },
    },
  };
  
  const [labels, setLabels] = useState([]);
  const [values, setValues] = useState([]);

  const refresh = async () => {
    console.log("refresh in drawChart");
    const data = await axios({
      method: 'get',
      url: `${BASEURL}/doctor/patients/data/new/${vital.code}/${id}?t=${functionRef.current[`${vital.code}_lg`]}`,
      headers: { 
          'authorization': localStorage.getItem('token')
        }
    });
    // console.log(data.data.payload);
    if(data.data.payload.length == 0) return;

    let lg = 0;
    let tmp1 = (data.data.payload).map(elem => elem.val);
    let tmp2 = (data.data.payload).map(elem => {
      if(elem.timestamp > lg && elem.timestamp > 0)  lg = elem.timestamp;
      let myDate = new Date(elem.timestamp * 1000);
      return myDate.toLocaleTimeString().substring(0,5);
    });  
    tmp1.reverse();
    tmp2.reverse();

    let previousValues = functionRef.current[`${vital.code}_values`];
    let previousLabels = functionRef.current[`${vital.code}_labels`];
    functionRef.current[`${vital.code}_lg`] = lg+1;
    
    const tmpsz = tmp1.length;
    // y|x=BS-n => y-(BS-n)
    if(tmpsz >= CHARTSIZE) {
      previousLabels = [];
      previousValues = [];
    }else {
      const d = previousLabels.length - (CHARTSIZE-tmpsz);
      previousLabels.splice(0, d);
      previousValues.splice(0, d);
    }

    setValues([...previousValues, ...tmp1]);  
    setLabels([...previousLabels, ...tmp2]);

    functionRef.current[`${vital.code}_values`] = [...previousValues, ...tmp1];
    functionRef.current[`${vital.code}_labels`] = [...previousLabels, ...tmp2];
  }
  
  const getOldVital = async (id, vitalCode) => {
    const data = await axios({
        method: 'get',
        url: `${BASEURL}/doctor/patients/data/old/${vitalCode}/${id}?p=${CHARTSIZE}`,
        headers: { 
            'authorization': localStorage.getItem('token')
          }
    });
    // console.log(id);
    // console.log("VITALSDATA", data.data.payload); 
    let lg = 0;
    let tmp1 = (data.data.payload).map(elem => elem.val);
    let tmp2 = (data.data.payload).map(elem => {
      if(elem.timestamp > lg && elem.timestamp > 0)  lg = elem.timestamp;
      let myDate = new Date(elem.timestamp * 1000);
      // console.log(myDate.toLocaleTimeString());
      return myDate.toLocaleTimeString().substring(0,5);
      // return elem.timestamp;
    });    
    tmp1.reverse();
    tmp2.reverse();
    
    setValues(tmp1);  
    setLabels(tmp2);

    functionRef.current[`${vital.code}_values`] = tmp1;
    functionRef.current[`${vital.code}_labels`] = tmp2;
    functionRef.current[`${vital.code}_lg`] = lg+1;
  } 
  
  useEffect(() => {
    functionRef.current[`${vital.code}`] = refresh;
    functionRef.current[`${vital.code}_labels`] = labels;
    functionRef.current[`${vital.code}_values`] = values;
     getOldVital(id, vital.code); 
    }, []);  
  
  const data = {
    labels,
    datasets: [
      {
        label: vital.code,
        data: values,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      }
    ],
  };
  return (
    <div className="chartDesign">
      <Line options={options} data={data} />
    </div>
  )
};

export default Drawchart;
