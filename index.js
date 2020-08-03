import { createMachine, interpret, assign } from "xstate";

const tripField = document.querySelector("#trip");
const returnField = document.querySelector("#returnDate");
const tripDate = document.querySelector("#tripDate");
const submitButton = document.querySelector("#submit");
const userMessage = document.querySelector('#message');

// two states
// editing : button is enabled, no message
// submitted : button is disabled, there is a message

// add the two states

const machine = createMachine({
  initial: "editing",
  context: {
    trip: "One Way", // either "Round Trip" or "One Way"
    returnDate: null,
    tripDate: null,
  },
  states: {
    editing: {
      on: {
        "UPDATE.TRIP": {
          actions: assign({ trip: (_, event) => event.value }),
        },
        "UPDATE.OUTBOUND": {
          actions: assign({ tripDate: (_, event) => event.value }),
        },
        "UPDATE.INBOUND": {
          actions: assign({ returnDate: (_, event) => event.value }),
        },
        SUBMIT: {
          cond: (ctx) => {
            if (ctx.trip === "One Way") {
              return !!ctx.tripDate;
            } else {
              return (
                !!ctx.returnDate &&
                !!ctx.tripDate &&
                ctx.returnDate > ctx.tripDate
              );
            }
          },
          target: "submitted",
        },
      },
    },
    submitted: {
      entry: () => console.log("in submitted state"),
      type: 'final'
    },
  },
});

const service = interpret(machine);
service.start();

service.onTransition((state) => {
  console.log("ctx on transition", state.context);
  // disable or enable return field based on select
  if (state.context.trip === "One Way") {
    returnField.setAttribute("disabled", true);
  } else {
    returnField.removeAttribute("disabled");
  }

  // use logic in machine to see if a submit now would be allowed
  // disable or enable the button accordingly
  const canSubmit = machine.transition(state, "SUBMIT").changed;
  if (canSubmit) submitButton.removeAttribute("disabled");
  else submitButton.setAttribute("disabled", true);

  if (state.value === "submitted") {
    if (state.context.trip === "One Way"){
      userMessage.innerHTML = `You have booked a flight for ${state.context.tripDate}!`
    }
    else {
      userMessage.innerHTML = `You have booked a flight for ${state.context.tripDate} returning on ${state.context.returnDate}!`
    }
    
  }
});

tripField.addEventListener("change", (e) =>
  service.send({ type: "UPDATE.TRIP", value: e.target.value })
);

tripDate.addEventListener("change", (e) => {
  service.send({ type: "UPDATE.OUTBOUND", value: e.target.value });
});
returnField.addEventListener("change", (e) => {
  service.send({ type: "UPDATE.INBOUND", value: e.target.value });
});

submitButton.addEventListener("click", (e) => {
  service.send({ type: "SUBMIT" });
});
