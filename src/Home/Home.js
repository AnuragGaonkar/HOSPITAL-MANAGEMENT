import React from 'react';
import Navbar from '../Navbar/Navbar';
import './Home.css';  
import Carousel from './Carousel';
import login from './loginaspatient.jpg';
import register from './register.jpg';
import fillform from './fillform.png';

function Home() {
    return (
        <div>
            <Navbar />
            <Carousel />
            <div className="process-flow">
                <h2>Process Flow</h2>
                <div className="process-steps">
                    <div className="step">
                        <img src={login} alt="Login" className="step-image"/>
                        <p>1.Login as Patient</p>
                        <div className="arrow-right"></div>
                    </div>
                    <div className="step">
                        <img src={register} alt="Register" className="step-image"/>
                        <p>2.Click Register for New Patient</p>
                        <div className="arrow-right"></div>
                    </div>
                    <div className="step">
                        <img src={fillform} alt="Fill Form" className="step-image"/>
                        <p>3.Fill the Form</p>
                        <div className="arrow-right"></div>
                    </div>
                    <div className="step">
                        <img src="path/to/appointment-image.jpg" alt="Appointment" className="step-image"/>
                        <p>4.Take Appointment</p>
                        <div className="arrow-right"></div>
                    </div>
                    <div className="step">
                        <img src="path/to/case-image.jpg" alt="Choose Case" className="step-image"/>
                        <p>5.Choose the Case</p>
                        <div className="arrow-right"></div>
                    </div>
                    <div className="step">
                        <img src="path/to/filter-image.jpg" alt="Filter" className="step-image"/>
                        <p>6.Filter as Per Required</p>
                        <div className="arrow-right"></div>
                    </div>
                    <div className="step">
                        <img src="path/to/hospital-image.jpg" alt="Hospital" className="step-image"/>
                        <p>7.Select Your Hospital</p>
                        <div className="arrow-right"></div>
                    </div>
                    <div className="step">
                        <img src="path/to/queue-image.jpg" alt="Queue" className="step-image"/>
                        <p>8.See the Queue</p>
                        <div className="arrow-right"></div>
                    </div>
                    <div className="step">
                        <img src="path/to/confirm-image.jpg" alt="Confirm" className="step-image"/>
                        <p>9.Confirm Appointment</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
