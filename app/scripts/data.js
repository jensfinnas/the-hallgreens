// From csv
function getDataFromCSV(callback) {
	d3.csv("data/Hallgrens släktträd - Personer.csv", function(error, nodeData) {
		if (error) throw error;

		d3.csv("data/Hallgrens släktträd - Relationer.csv", function(error, edgeData) {
			if (error) throw error;

			var data = prepareData(nodeData, edgeData);
			callback(data.nodes, data.edges);
		})	
	})
}

// From Google Spreadsheet
function getDataFromGoogleSpreadsheet(callback) {
	Tabletop.init({
		key: '1RWInLMTyAt1DSjXdnvPqOTd9lAE87UjTTZLY2ZENpts',
		callback: function(data, tabletop) {
			var nodeData = tabletop.sheets("Personer").elements;
			var edgeData = tabletop.sheets("Relationer").elements;

			var data = prepareData(nodeData, edgeData);
			callback(data.nodes, data.edges);
		},
		simpleSheet: true }
	)
}

// Format data properly 
function prepareData(nodeData, edgeData) {
	nodeData.map(function(d) {
	  d["Födelseår"] = +d["Födelseår"];
	  d["Lingarödelägare"] = d["Lingarödelägare"] == "TRUE";
	  d["Nu levande"] = d["Nu levande"] == "TRUE";
	  d["hasPartner"] = d["Partner"] !== "";
	})

	persons = nodeData.reduce(function(map, node) {
	  map[node[personIdColum]] = node;
	  return map;
	}, {});

	edgeData = edgeData.map(function(d) {
	  d = mergeObjects(d, persons[d[childIdColumn]])
	  return d;
	})

	return {
		"nodes": nodeData,
		"edges": edgeData
	}
}

/* Pass an array of objects and parse tree structured data */
function treeify(data, parentKey, childKey) {
    var dataMap = data.reduce(function(map, node) {
      map[node[childKey]] = node;
      return map;
    }, {});

    // create the tree array
    var treeData = [];
    data.forEach(function(node) {
      // add to parent
      var parent = dataMap[node[parentKey]];
      if (parent) {
        // create child array if it doesn't exist
        (parent.children || (parent.children = []))
          // add node to child array
          .push(node);
      } else {
        // parent is null or missing
        treeData.push(node);
      }
    });
    return treeData;
  }