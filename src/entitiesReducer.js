function EntityCollection(url = '', docs = []) {
  return {
    url,
    collection: [].concat(docs),
    status: 'idle'
  }
}

function entitiesReducer(state, action) {
  return actions[action.type] ?
    actions[action.type](entities, action.data) :
    entities
}

function getCollectionByName(name, entities) {
  if (!entities[name])
    entities[name] = EntityCollection()

  return entities[name]
}

var actions = {
  INSERT: (entities, data) => {
    var collection = getCollectionByName(data.collection, entities)

    collection.concat(data.entity)

    return entities
  },
  UPDATE: (entities, data) => {
    var {
      filter,
      updates
    } = data
    var collection = getCollectionByName(data.collection, entities)
    var matched = _.filter(collection, filter)

    _.each(matched, match => {
      _.each(updates, (fields, operation) => {
        switch (operation) {
          case '$set':
            return _.merge(match, fields)
          case '$unset':
            return _.each(fields, (value, key) => delete match[key])
          default:
            return console.warn(`Unknown update operation: ${operation}`)
        }
      })
    })
  },
  REMOVE: (entities, data) => {
    return _.without(entities[data.collection], data.filter)
  }
}