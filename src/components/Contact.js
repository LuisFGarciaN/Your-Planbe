import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import logic from "../logic";
import Header from "./Header";

class Contact extends Component {
  state = {
    errorMessage: null,
    successMessage: null,
    subject: "",
    textarea: ""
  };

  componentDidMount = () => {
    this.setState({
      errorMessage: null,
      successMessage: null,
      subject: "",
      textarea: ""
    });
  };

  handleChange = e => {
    const name = e.target.name;
    const value = e.target.value;
    this.setState({ ...this.state, [name]: value });
  };

  handleSubmit = event => {
    event.preventDefault();

    const { subject, textarea } = this.state;
    debugger;

    try {
      logic
        .sendContactForm(subject, textarea)
        .then(() => {
          this.setState({
            successMessage: "Thanks, We will answer you ASAP to your email!",
            errorMessage: null,
            subject: "",
            textarea: ""
          });
          setTimeout(() => {
            this.setState({ successMessage: null });
          }, 1500);
        })
        .catch(err => {
          this.setState({ errorMessage: err.message }, () => {
            setTimeout(() => {
              this.setState({ errorMessage: null });
            }, 2000);
          });
        });
    } catch (err) {
      this.setState({ errorMessage: err.message }, () => {
        setTimeout(() => {
          this.setState({ errorMessage: null });
        }, 2000);
      });
    }
  };

  error = () => {
    if (this.state.successMessage) {
      return <p className="correct">{this.state.successMessage}</p>;
    } else if (this.state.errorMessage) {
      return <p className="error">{this.state.errorMessage}</p>;
    }
    return null;
  };
  render() {
    const { handleChange, handleSubmit, error } = this;

    return (
      <div className="contact__page">
        <Header
          home={false}
          profile={false}
          contact={true}
          cart={false}
          vieworders={false}
        />
        <div className="contact__container">
          <div>
            <h1 className="contact__title">Contact</h1>
            <form className="form-group contact__form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>SUBJECT</label>
                <input
                  className="form-control"
                  type="text"
                  required
                  autoFocus
                  name="subject"
                  placeholder="Email subject"
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>MESSAGE</label>
                <textarea
                  className="form-control"
                  type="text"
                  required
                  name="textarea"
                  placeholder="Type your message here..."
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <button className="btn btn-primary btn-lg" type="submit">
                  Send
                </button>
              </div>
              {error()}
            </form>
          </div>
          <div>
            <section className="contact__section2">
              <h2 className="contact__section2--title">
                Where can you find us?
              </h2>
              <p>
                <i class="fas fa-map-marker-alt" /> Address: Example
              </p>
              <p>
                <a href="https://www.instagram.com">
                  <i className="fab fa-instagram" /> Instagram
                </a>
              </p>
              <p>
                <i class="fas fa-envelope" /> Email: example@example.com
              </p>
              <p>
                <i class="fas fa-phone" /> Phone: +01 111 111 111
              </p>
              <iframe
                className="contact__map"
                src="https://www.google.com/maps/"
                frameborder="0"
                allowFullScreen
              />
            </section>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Contact);
