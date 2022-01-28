import React, { Component } from "react";
import ContactList from "./ContactList";
import gapi from "gapi-client";
 
const SCOPES = "https://www.googleapis.com/auth/contacts";
const API_KEY = "AIzaSyD_z5bEOyHdfSn34CcLMh4T2YAyqLKwxBU";
const CLIENT_ID= "639542597798-mlrd3h9hvv6jc6l7emsq81907rrhthgs.apps.googleusercontent.com";
class People extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isloggedIn: false,
      user: null,
      connections: []
    };
    console.log(gapi.cli);
    this.fetchUser = this.fetchUser.bind(this);
    this.fetchConnections = this.fetchConnections.bind(this);
  }
  componentDidMount() {
    if (gapi) {
      gapi.load(
        "client:auth2",
        gapi.client
          .init({
            apiKey: API_KEY,
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/people/v1/rest"
            ],
            clientId: CLIENT_ID,
            scope: SCOPES
          })
          .then(() => {
            if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
              this.setState((prevState, props) => {
                this.fetchUser();

                return {
                  isloggedIn: gapi.auth2.getAuthInstance().isSignedIn.get()
                };
              });
            }
          })
      );
    }
  }
  fetchUser() {
  
    gapi.client.people.people
      .get({
        resourceName: "people/me",
        "requestMask.includeField": "person.names"
      })
      .then(response => {
        this.setState({
          user: JSON.stringify(response.result.names[0])
        });

        this.setState((prevState, props) => {
          this.fetchConnections();
          return {
            user: JSON.stringify(response.result.names[0])
          };
        });
      });
  }
  fetchConnections() {
    gapi.client.people.people.connections
      .list({
        resourceName: "people/me",
        pageSize: 10,
        personFields: "names,genders,birthdays",
        sortOrder:"FIRST_NAME_ASCENDING"
      })
      .then(response =>
        response.result?.connections?.map(user => ({
          personId: `${user?.resourceName}`,
          firstname: `${(user?.names) ? user.names[0]?.givenName : 'Nil'}`,
          lastname: `${(user?.names)? user.names[0]?.familyName: 'Nil'}`,
          gender: `${ (user?.genders) ? user?.genders[0]?.value:'Nil'}`,
          birthday: `${ (user.birthdays) ? user?.birthdays[0]?.value:'Nil'}`
        }))
      )
      .then(list => JSON.stringify(list))
      .then(connections =>
        this.setState({
          connections
        })
      )
      .catch(error => console.log("parsing failed", error));
  }
  delete = contact => {
  gapi.client.people.people.deleteContact({   resourceName: contact.personId, }).then(response => {

    console.log("Contact deleted:" + contact.personId)
    this.fetchConnections();
  }); 
 }
  SignIn() {
    gapi.auth2
      .getAuthInstance()
      .signIn()
      .then(() => {


        this.setState({
          isloggedIn: true
        });

        this.fetchUser();

      });
  }
  SignOut() {
    gapi.auth2.getAuthInstance().signOut();
    this.setState({
      isloggedIn: false
    });
  }

  renderUser(cUser,isloggedIn) {
    if (cUser && isloggedIn) {
      let obj = JSON.parse(cUser);
      return <h3> Welcome {obj.givenName} </h3>;
    } else {
      return <h3 className="text-danger"> You are not signedIn </h3>;
    }
  }
  render() {
    const { isloggedIn, user, connections } = this.state;

    return (


      <div className="People">
        <h2> GOOGLE'S PEOPLE API </h2>
        <h3> reactJs example to fetch contacts. </h3>
        {this.renderUser(user,isloggedIn)}
        {!isloggedIn ? (
          <button
            className="btn btn-sm btn-info"
            onClick={e => {
              this.SignIn();
            }}
          >
            SignIn
          </button>
        ) : (
          
          <button
            className="btn btn-sm btn-danger"
            onClick={e => {
              this.SignOut();
            }}
          >
            SignOut
          </button>
        )}

        <div className="panel-group" />
        { console.log(connections) }
        {isloggedIn ? (
            connections?.length > 0 ? (
            <ContactList connections={JSON.parse(connections)} delete={this.delete} />
          ) : null
        ) : null}
      </div>
    );
  }
}

export default People;