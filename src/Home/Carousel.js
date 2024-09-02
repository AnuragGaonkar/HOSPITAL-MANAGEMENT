import React, { useState, useEffect, useRef } from 'react';
import './Carousel.css';

// Import images
import img1 from './1st.jpg';
import img2 from './2nd.jpg';
import img3 from './3rd.jpg';
import img4 from './4th.jpg';

const Carousel = () => {
  const [index, setIndex] = useState(0);
  const [autoSlide, setAutoSlide] = useState(true);
  const timerRef = useRef(null);

  const items = [
    {
      img: img1, // Use imported images
      title: "Here to Help You",
      description: "Our dedicated team of medical professionals is always here to assist you with your health needs. We're committed to providing the best care and support for your well-being.",
    },
    {
      img: img2,
      title: "Your Health Matters",
      description: "Maintaining good health is essential for a happy life. At our clinic, we prioritize your health and offer comprehensive services to ensure your heart stays strong and your body remains in top condition.",
    },
    {
      img: img3,
      title: "Accurate Diagnoses",
      description: "Our advanced diagnostic tools and experienced specialists work together to provide accurate and timely diagnoses, helping you understand your condition and get the right treatment.",
    },
    {
      img: img4,
      title: "Personalized Treatment Plans",
      description: "We create tailored treatment plans based on your unique diagnostic results. Our goal is to address your specific health concerns and support your journey to better health.",
    },
  ];

  useEffect(() => {
    startAutoSlide();
    return () => clearTimeout(timerRef.current);
  }, [index]);

  const startAutoSlide = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, 4000); // Auto slide interval set to 4 seconds
  };

  const handleThumbClick = (ind) => {
    setIndex(ind);
    setAutoSlide(false);
    startAutoSlide();
  };


  return (
    <div className="carousel">
      {items.map((item, ind) => (
        <div className={`item ${index === ind ? 'active' : ''}`} key={ind}>
          <div className="img-box">
            <img src={item.img} alt={item.title} />
          </div>
          <div className="info-box">
            <div className="info-slider">
              <div className="info-item">
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
      <ul className="thumb">
        {items.map((_, ind) => (
          <li
            className={index === ind ? 'selected' : ''}
            onClick={() => handleThumbClick(ind)}
            key={ind}
          >
            <img src={items[ind].img} alt={`Thumb ${ind + 1}`} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Carousel;
