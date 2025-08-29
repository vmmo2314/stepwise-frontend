import React, { Component } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
//import { Bar } from 'react-chartjs-2';
//import faker from 'faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

class BarChart1 extends Component {
  render() {
    const data = {
      defaultFontFamily: "Poppins",
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      datasets: [
        {
          label: "My First dataset",
          data: [65, 59, 80, 81, 56, 55, 40],
          borderColor: "rgba(54,201,95,1)",
          borderWidth: "0",
          backgroundColor: "rgba(54,201,95,1)",
		      barPercentage: 0.5,
		   
        },
      ],
    };

    const options = {
      plugins:{
        legend: false,	
      },
      
      scales: {
        y:
          {
            ticks: {
              beginAtZero: true,
            },
          },
        
        x: 
          {        
            barPercentage: 0.5,
          },
        
      },
  };

    return (
      <>
        <Bar data={data} height={150} options={options} />
      </>
    );
  }
}

export default BarChart1;
