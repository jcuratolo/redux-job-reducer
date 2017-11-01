var _ = require('lodash')
var redux = require('redux')
var axios = require('axios')

var store = redux.createStore(
  redux.combineReducers({
    jobs: jobsReducer
  })
)

window.url = 'http://conduit.productionready.io/api'
window.store = store
window.request = function (name, method, url, data) {
  store.dispatch({
    type: 'job.new',
    data: {
      type: 'request',
      method: method,
      name: name,
      url: url,
      data: data || {}
    }
  })

  return awaitRequest(name)
}

store.subscribe(() => {
  var state = store.getState()

  render(state)
  performJobs(state.jobs)
})

function render(state) {
  window.stateDisplay = JSON.stringify(state, null, 2)
}

// Distribute jobs to workers on state change
function performJobs(jobs) {
  _.each(jobs.ready, job => {
    switch(job.type) {
      case 'request': return setTimeout(() => httpWorker(job), 1000)
      default: return console.warn(`Unknown job type '${job.type}'`)
    }
  })
}

// Util to use a promise to observe the completion of a request job
function awaitRequest(name) {
  return new Promise((resolve, reject) => {
    var unsub = store.subscribe(() => {
      var state = store.getState()

      if (!state.jobs.done[name]) return
      
      unsub()
      state.jobs.done[name].error
        ? reject()
        : resolve()
    })
  })
}

// Handle the jobs slice of state
function jobsReducer(state = {ready: {}, inProgress: {}, done: {}}, {type, data}) {
  switch (type) {
    case 'job.new':
      var job = data
      var name = data.name
      return _.chain(state)
        .cloneDeep()
        .set(`ready.${name}`, job)
        .value()

    case 'job.start':
      return _.chain(state)
        .cloneDeep()
        .tap((state) => {
          state.inProgress[data.name] = state.ready[data.name]
          delete state.ready[data.name]
        })
        .value()

    case 'job.done':
      return _.chain(state)
        .cloneDeep()
        .tap(state => {
          state.done[data.name] = data.result
          delete state.inProgress[data.name]
        })
        .value()

    default: return state
  }
}

// Runs requests and updates the store appropriately
function httpWorker(job) {
  store.dispatch({
    type: 'job.start',
    data: {
      name: job.name,
    }
  })

  axios({
      url: job.url,
      method: job.method,
      data: job.data || {}
    })
    .then(response => {
      store.dispatch({
        type: 'job.done',
        data: {
          name: job.name,
          result: response.data
        }
      })
    })
    .catch(error => {
      store.dispatch({
        type: 'job.done',
        data: {
          name: job.name,
          result: {
            error: error
          }
        }
      })
    })
}

