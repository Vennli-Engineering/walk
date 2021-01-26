 function getVal(input) {
            return input.val() ? input.val() : input.attr('placeholder');
        }
        $('#field').change(function() {
            $('#args').children().hide();
            let which = '.' + this.value;
            $('#args').children(which).show();

        });
        MemberStack.onReady.then(async function(member) {
            window.MemberStack.reload();
            let metadata = await member.getMetaData();
            let ecosystems = metadata.ecosystems;
            let key = metadata.key
            console.log(ecosystems);
            let ecosystemDropdown = $('#ecosystem');
            for (let i = 0; i < ecosystems.length; i++) {
               ecosystemDropdown.append($('<option />').val(ecosystems[i]).text(ecosystems[i])); 
            }

        $('#submit').click(() => {
            $('#tableTitle').hide();
                $('#results').DataTable().destroy();
            $('#tableTitle').after("<table id='results' style='width: 75%; margin: auto;'><thead></thead><tbody></tbody></table>"); 
            let apiCall = $('#field').val();
            $('tr:not(#' + apiCall + ')').hide();
            $('#loading').show();
            let data = new Map();
            data.set('TRD', ['/rank', {'rank_type': 'domain','maximum_rows_to_return': parseInt(getVal($('#trdRows')))}, ['Domain', 'Discoverability', 'Pagerank']]);
            data.set('TRDS', ['/rank', {'rank_type': 'domain','search_topic': getVal($('#trdTopic')), 'maximum_rows_to_return': parseInt(getVal($('#trdsRows')))}, ['Domain', 'Number of matching queries', 'Median matching Lucene score', 'Average matching Lucene score', 'Maximum matching Lucene score']]);
            data.set('TRP', ['/rank', {'rank_type': 'content', 'maximum_rows_to_return': parseInt(getVal($('#trpRows')))}, ['Content Title', 'Discoverability', 'Pagerank']]);
            data.set('TRPS', ['/rank', {'rank_type': 'content','search_topic': getVal($('#trpTopic')), 'maximum_rows_to_return': parseInt(getVal($('#trpsRows')))}, ['Content Title', 'Number of matching queries', 'Median matching Lucene score', 'Average matching Lucene score', 'Maximum matching Lucene score']]);
            data.set('CPILL', ['/topic', {}, ['', 'Pillar Concept', 'Sum of Pageranks', 'Number of queries']]);
            data.set('REC', ['/recommend', {'page_url': getVal($('#recURL')),'maximum_rows_to_return': parseInt(getVal($('#maxRows')))}, ['Content Title', 'Discoverability', 'Pagerank']]);
            data.set('IP', ['/recommend', {'recommendation_type': 'intent_profile', 'pillar_community_id': parseInt(getVal($('#pillID')))}, ['SERP Question', 'Intent']]);
            data.set('IPQ', ['/recommend', {'recommendation_type': 'intent_profile_with_query', 'query_node': getVal($('#queryNode')), 'pillar_community_id': parseInt(getVal($('#pillIDQ')))}, ['SERP Question', 'Intent']]);
            data.set('IPC', ['/recommend', {'recommendation_type': 'intent_profile_with_content', 'content_url': getVal($('#ipURL')), 'pillar_community_id': parseInt(getVal($('#pillIDC')))}, ['SERP Question', 'Intent']]);
            data.set('REL', ['/recommend', {'recommendation_type': 'relevance_profile','domain': getVal($('#relDomain'))}, ['Content Title', 'Terms', 'Relevance Score', 'Most Relevant Term', 'Most Relevant Community ID']]);
            let settings = {
                "url": "https://utyp9ag0d3.execute-api.us-east-2.amazonaws.com/dev" + data.get(apiCall)[0],
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Accept": "application/json",
                    "x-api-key": key,
                    "InvocationType": "RequestResponse",
                    "Content-Type": "application/json"
                }
            };
            let ecosystem = $('#ecosystem').val();
            data.get(apiCall)[1].ecosystem_name = ecosystem;
            console.log(getVal($('#ecosystem')));
            settings.data = JSON.stringify(data.get(apiCall)[1]);
            // Round cells to 2 decimal places
             function round(data, type, row) {
                 return parseFloat(data).toFixed(2);
            }
            // Create journey summary
            function journeySummary(journey) {
                    let total = [journey.awareness, journey.consideration, journey.conversion, journey.retention, journey.advocacy].reduce((a, b) => a + b, 0);
                    function percent(n) {
                        return (n + ' (' + ((n / total) * 100).toFixed(2) + '%)');
                    }
                    return '<h2>• Awareness: ' + percent(journey.awareness) + '<br /> • Consideration: ' + percent(journey.consideration) + '<br /> • Conversion: ' + percent(journey.conversion) + '<br /> • Retention: ' + percent(journey.retention) + '<br /> • Advocacy ' + percent(journey.advocacy) + '</h2>';
            }
            // Unbind click from tables with child rows
            $('#results').prop('onclick', null);
            $.ajax(settings).done(function(response) {
                $('#loading').hide();
                $('#tableTitle').text($('#field option[value="' + apiCall + '"]').text());
                $('#tableTitle').show();
                $('#' + apiCall).show();
                $('#results').find('tbody').empty();
                // Set new table head
                $('#results').find('thead').empty()
                let thead = '<tr>';
                for (let i = 0; i < data.get(apiCall)[2].length; i++) {
                    thead += '<th>' + data.get(apiCall)[2][i] + '</th>';
                }
                thead += '</tr>';
                $('#results').find('thead').append(thead);
                if (apiCall === 'TRD' || apiCall === 'TRP') {
                    let content = JSON.parse(response.body).content;
                    for (let i = 0; i < content.length; i++) {
                        if (apiCall === 'TRD') {
                            $('#results').find('tbody').append('<tr><td>' + content[i].domain + '</td><td>' + content[i].discoverability + '</td><td>' + content[i].pagerank + '</td></tr>');
                        } else if (apiCall === 'TRP') {
                            $('#results').find('tbody').append('<tr><td><a href="' + content[i].content_url + '">' + content[i].content_title + '</a></td><td>' + content[i].discoverability + '</td><td>' + content[i].pagerank + '</td></tr>');
                        }
                    }
                    $('#results').DataTable({
                        order: [[1, 'desc']],
                        columnDefs: [{
                            targets: [1, 2],
                            render: round
                        }]
                    });
                } else if (apiCall === 'TRDS') {
                    $('#tableTitle').text('Top ranked domains for search topic "' + getVal($('#trdTopic')) + '"');
                    let content = JSON.parse(response.body).domains;
                    for (let i = 0; i < content.length; i++) {
                        $('#results').find('tbody').append('<tr><td>' + content[i].domain + '</td><td>' + content[i].num_matching_queries + '</td><td>' + content[i].median_matching_query_lucene_score + '</td><td>' + content[i].avg_matching_query_lucene_score + '</td><td>' + content[i].maximum_matching_query_lucene_score + '</td></tr>');
                    }
                    $('#results').DataTable({
                        columnDefs: [{
                            targets: [2, 3, 4],
                            render: round
                        }]
                    });
                } else if (apiCall === 'TRPS') {
                    $('#tableTitle').text('Top ranked pages for search topic "' + getVal($('#trdTopic')) + '"');
                    let content = JSON.parse(response.body).content;
                    for (let i = 0; i < content.length; i++) {
                        $('#results').find('tbody').append('<tr><td><a href="' + content[i].content_url + '">' + content[i].content_title + '</a></td><td>' + content[i].num_matching_queries + '</td><td>' + content[i].median_matching_query_lucene_score + '</td><td>' + content[i].avg_matching_query_lucene_score + '</td><td>' + content[i].maximum_matching_query_lucene_score + '</td></tr>');
                    }
                    $('#results').DataTable({
                        columnDefs: [{
                            targets: [2, 3, 4],
                            render: round
                        }]
                    });
                } 
                else if (apiCall === 'CPILL') {
                    console.log(JSON.parse(response.body));
                    // construct nested table, needs to have thead
                    function format(d) {
                        let table = '<table style="width:75%;"><thead><tr><th>Term</th><th>Pagerank</th></tr></thead><tbody>';
                        for (let i of d.subtopics) {
                            table += '<tr><td>';
                            table += i.term;
                            table += '</td><td>';
                            table += i.pagerank;
                            table += '</td></tr>';
                        }
                        table += '</tbody></table>';
                        console.log(table);
                        return table;
                    }
                    let results = $('#results').DataTable({
                        data: JSON.parse(response.body),
                        columns: [
                            {
                                className: 'details-control',
                                data: null,
                                defaultContent: '',
                                orderable: false
                            },
                            {data: 'pillar_concept'},
                            {
                                data: 'subtopics',
                                render: function(data, type, row) {
                                    let total = 0;
                                    for (let i of data) {
                                        total += i.pagerank;
                                    }
                                    return total.toFixed(2);
                                }
                            },
                            {data: 'num_queries'}
                        ],
                        order: [[2, 'desc']]
                    });
                    $('#results').on('click', 'td.details-control', function() {
                        let tr = $(this).closest('tr');
                        let row = results.row(tr);
                        if (row.child.isShown()) {
                            row.child.hide();
                            tr.removeClass('shown');
                        }
                        else {
                            row.child(format(row.data())).show();
                            // make child table a DataTable
                            $(row.child().find('table')).DataTable({
                                order: [[1, 'desc']],
                                columnDefs: [{
                                    targets: 1,
                                    render: round
                                }]
                            });
                            tr.addClass('shown');
                        }
                    });
                    
                }
                else if (apiCall === 'IP') {
                    let journey = JSON.parse(response.body).journey_stage_summary;
                    $('#tableTitle').html('Intent profile for ecosystem "' + ecosystem + '" for pillar ID ' + getVal($('#pillID')) + journeySummary(journey)); 
                    let content = JSON.parse(response.body).serp_questions;
                    for (let i = 0; i < content.length; i++) {
                        $('#results').find('tbody').append('<tr><td>' + content[i].question + '</td><td>' + content[i].intent_label + '</td></tr>');
                    }
                    $('#results').DataTable({
                        order: [[1, 'asc']]
                    });
                }
                else if (apiCall === 'IPQ') {
                    let journey = JSON.parse(response.body).journey_stage_summary;
                    $('#tableTitle').html('Intent profile for ecosystem "' + ecosystem + '" with query node "' + getVal($('#queryNode')) + '" for pillar ID ' + getVal($('#pillIDQ')) + journeySummary(journey));
                    let content = JSON.parse(response.body).serp_questions;
                    for (let i = 0; i < content.length; i++) {
                        $('#results').find('tbody').append('<tr><td>' + content[i].question + '</td><td>' + content[i].intent_label + '</td></tr>');
                    }
                    $('#results').DataTable({
                        order: [[1, 'asc']]
                    });
                }
                else if (apiCall === 'IPC') {
                    let journey = JSON.parse(response.body).journey_stage_summary; 
                    $('#tableTitle').html('Intent profile for ecosystem "' + ecosystem + '" with content URL "' + getVal($('#ipURL')) + '" for pillar ID ' + getVal($('#pillIDC')) + journeySummary(journey)); 
                    let content = JSON.parse(response.body).serp_questions;
                    for (let i = 0; i < content.length; i++) {
                        $('#results').find('tbody').append('<tr><td>' + content[i].question + '</td><td>' + content[i].intent_label + '</td></tr>');
                    }
                    $('#results').DataTable({
                        order: [[1, 'asc']]
                    });
                }
                else if (apiCall === 'REC') {
                    $('#tableTitle').text('Recommendations for URL "' + JSON.parse(response.body).source + '"');
                    let content = JSON.parse(response.body).related_content;
                    for (let i = 0; i < content.length; i++) {
                        $('#results').find('tbody').append('<tr><td><a href="' + content[i].url + '">' + content[i].title + '</a></td><td>' + content[i].discoverability + '</td><td>' + content[i].pagerank + '</td></tr>');
                    }
                    $('#results').DataTable({
                        order: [[1, 'desc']],
                        columnDefs: [{
                            targets: [1, 2],
                            render: round
                        }]
                    });
                }
                else if (apiCall === 'REL') {
                    $('#tableTitle').text('Relevance profile for domain ' + getVal($('#relDomain')));
                    let content = JSON.parse(response.body).content;
                    for (let i = 0; i < content.length; i++) {
                        let terms = '';
                        for (let j = 0; j < content[i].terms.length; j++) {
                            terms += content[i].terms[j] + ((j < content[i].terms.length - 1) ? ', ' : '');
                        }
                        console.log(terms);
                        $('#results').find('tbody').append('<tr><td><a href="' + content[i].url + '">' + content[i].title + '</a></td><td>' + terms + '</td><td>' + content[i].relevance_score + '</td><td>' + content[i].most_relevant_term + '</td><td>' + content[i].most_relevant_community_id + '</td></tr>');
                    }
                    $('#results').DataTable({
                        order: [[2, 'desc']],
                        columnDefs: [{
                            targets: 2,
                            render: round
                        }]
                    });
                }

            });





        });
        });
