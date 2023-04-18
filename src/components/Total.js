import React from 'react'

const Total = props => { 


    return <article className="total__container">
          <p className="total__message">Total: { props.calculatedTotal } <i className="fas fa-dollar-sign" /> </p>
        </article>
}

export default Total