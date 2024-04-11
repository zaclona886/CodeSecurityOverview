import * as React from 'react';
import { Header, TitleSize } from "azure-devops-ui/Header";
import { Card } from "azure-devops-ui/Card";
import * as SDK from "azure-devops-extension-sdk";
import { showRootComponent } from "../Common";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { ListSelection, ISimpleListCell } from "azure-devops-ui/List";
import { ColumnFill, ITableRow, renderSimpleCell, Table } from "azure-devops-ui/Table";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";

interface IHomePageState {
    projects: IProject[];
    isLoading: boolean;
    selectedItem: any,
    error: any,
}

interface IProject {
    id: string;
    name: string;
    repositories: IRepository[]; 
    advancedSecurityEnabledCount: number;
}

interface IRepository {
    name: string;
    alerts: IAlert[];
    alertCounts: { [type: string]: number };
}

interface IAlert {
    alertType: string;
    title: string;
}

interface IItemTableAllAlerts {
    projectName: ISimpleListCell;
    numberOfRepositories?: number;
    totalActiveAlerts?: number;
    dependencyAlerts?: number;
    codeAlerts?: number;
    secretAlerts?: number;
}

interface IItemTableTopAlerts {
    alertTitle?: string;
    alertOccurence?: string;
}

const columnsAllAlerts = [
    {
        id: "projectName",
        name: "Project Name",
        minWidth: 100,
        width: new ObservableValue(220),
        renderCell: renderSimpleCell
    },
    {
        id: "numberOfRepositories",
        name: "Nr. of Repositories",
        maxWidth: 100,
        width: new ObservableValue(120),
        renderCell: renderSimpleCell
    },
    {
        id: "numberOfEnabledAdvancedSecurity",
        name: "With Advanced Security",
        maxWidth: 100,
        width: new ObservableValue(150),
        renderCell: renderSimpleCell
    },
    {
        id: "totalActiveAlerts",
        name: "Total Active Alerts",
        maxWidth: 100,
        width: new ObservableValue(120),
        renderCell: renderSimpleCell
    },
    {
        id: "dependencyAlerts",
        name: "Dependency Alerts",
        maxWidth: 100,
        width: new ObservableValue(130),
        renderCell: renderSimpleCell
    },
    {
        id: "codeAlerts",
        name: "Code Alerts",
        maxWidth: 100,
        width: new ObservableValue(100),
        renderCell: renderSimpleCell
    },
    { 
        id: "secretAlerts", 
        name: "Secret Alerts", 
        maxWidth: 150,
        width: new ObservableValue(90), 
        renderCell: renderSimpleCell 
    },
    ColumnFill
];

interface IAlertWithCount extends IAlert {
    count: number;
}

// Global Constants
const ORGANIZATION_NAME = "SET_YOUR_ORGANIZATION_NAME";
const AZURE_DEVOPS_URL = `https://dev.azure.com/${ORGANIZATION_NAME}`;
const API_VERSION = "7.2-preview.1";
const ADVSEC_URL_BASE = `https://advsec.dev.azure.com/${ORGANIZATION_NAME}`;

export class HomePage extends React.Component<{}, IHomePageState> {
    private selection = new ListSelection(true);

    constructor(props: {}) {
        super(props);
        this.state = {
            projects: [],
            isLoading: true,
            selectedItem: null,
            error: null,
        };
    }

    public async componentDidMount() {
        try {
            SDK.init();
            const accessToken = await SDK.getAccessToken();           
            const HEADERS = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            };
    
            // Call fetchProjects with the updated headers
            await this.fetchProjects(HEADERS);
        } catch (error : any ){
            this.setState({ isLoading: false, error: `An error occurred: ${error.message}. Please try again later.` });
        }
        
    }

    onSelect = (event: React.SyntheticEvent<HTMLElement>, tableRow: ITableRow<Partial<IItemTableAllAlerts>>) => {
        const tableItem = tableRow.data as IItemTableAllAlerts;
        const selectedProject = this.state.projects.find(project => project.name === tableItem.projectName.text);
    
        if (selectedProject) {
            this.setState({ selectedItem: selectedProject });
        }
    }

    renderTopAlertsTables(selectedProject: IProject) {
        // Aggregate alerts and count occurrences
        let alertOccurrences = selectedProject.repositories.flatMap(repo => repo.alerts).reduce<{ [key: string]: IAlertWithCount }>((acc, alert) => {
            const key = `${alert.alertType}-${alert.title}`;
            if (!acc[key]) {
                acc[key] = { ...alert, count: 1 };
            } else {
                acc[key].count += 1;
            }
            return acc;
        }, {});
    
        // Function to get top 5 alerts of a specific type
        const getTopAlertsByType = (alertType: string) => {
            return Object.values(alertOccurrences)
                .filter(alert => alert.alertType === alertType)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map(alert => ({
                    alertTitle: alert.title,
                    alertOccurence: `Occurrence: ${alert.count}`,
                }));
        };
    
        // Filter and sort by occurrence for each type
        const topDependencyAlerts = getTopAlertsByType('dependency');
        const topCodeAlerts = getTopAlertsByType('code');
        const topSecretAlerts = getTopAlertsByType('secret');
    
        // Function to render alerts in a two-column layout inside a card
        const renderAlertsCard = (title : string, alerts : IItemTableTopAlerts[]) => {
            return (
                <Card className="flex-grow" titleProps={{ text: `${title} Alerts Details`, ariaLevel: 3 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
                        {alerts.length > 0 ? (
                            alerts.map((alert, index) => (
                                <div className="flex-column" style={{ minWidth: "120px" }} key={index}>
                                    <div className="body-m primary-text">{alert.alertTitle}</div>
                                    <div className="body-m secondary-text" style={{paddingBottom: '5px'}}>{alert.alertOccurence}</div>
                                </div>
                            ))
                        ) : (
                            <div>No alerts found</div>
                        )}
                    </div>
                </Card>
            );
        };
    
        // Render the cards
        return (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '5px', flexGrow: 1  }} >
                <div style={{ display: 'flex', flexDirection: 'column', padding: '5px', flexGrow: 1  }}>
                    {topDependencyAlerts.length > 0 && renderAlertsCard("Top 5 Dependency", topDependencyAlerts)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', padding: '5px', flexGrow: 1  }}>
                    {topCodeAlerts.length > 0 && renderAlertsCard("Top 5 Code", topCodeAlerts)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', padding: '5px', flexGrow: 1  }}>
                    {topSecretAlerts.length > 0 && renderAlertsCard("Top 5 Secret", topSecretAlerts)}
                </div>
            </div>
        );
    }

    fetchProjects = async (headers: any) => {
        try {
            const projectsResponse = await fetch(`${AZURE_DEVOPS_URL}/_apis/projects?api-version=${API_VERSION}`, { headers: headers });
            const projectsData = await projectsResponse.json();

            const filteredProjects = projectsData.value;
            const projects: IProject[] = await Promise.all(filteredProjects.map(async (project: any) => {
                const reposResponse = await fetch(`${AZURE_DEVOPS_URL}/${project.id}/_apis/git/repositories?api-version=${API_VERSION}`, { headers: headers });
                const reposData = await reposResponse.json();
                let advancedSecurityEnabledCount = 0;

                const repositoriesWithAlerts = await Promise.all(reposData.value.map(async (repo: any) => {
                    try {
                        const alertsResponse = await fetch(
                            `${ADVSEC_URL_BASE}/${project.name}
                                /_apis/alert/repositories/${repo.id}/alerts?top=10000&criteria.states=active
                                &criteria.onlyDefaultBranchAlerts=true&api-version=${API_VERSION}`
                            , { headers: headers });
                    if (!alertsResponse.ok) {
                        throw new Error(`API returned status ${alertsResponse.status}`);
                    }
                    const alertsData = await alertsResponse.json();
                        
                    const alerts: IAlert[] = alertsData.value.map((alert: any) => ({
                        alertType: alert.alertType,
                        title: alert.title,
                    }));
                
                    const alertCounts = alerts.reduce((acc: { [type: string]: number }, alert: IAlert) => {
                        acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
                        return acc;
                    }, {});

                    advancedSecurityEnabledCount++;
                
                    return {
                        name: repo.name,
                        alerts: alerts,
                        alertCounts: alertCounts,
                    };
                    } catch (error) {
                        return {
                            name: repo.name,
                            alerts: [],
                            alertCounts: {},
                        };
                    }
                }));

                return {
                    id: project.id,
                    name: project.name,
                    repositories: repositoriesWithAlerts,
                    advancedSecurityEnabledCount: advancedSecurityEnabledCount
                };
            }));

            this.setState({ projects, isLoading: false });
        } catch (error : any) {
            this.setState({  isLoading: false, error: `An error occurred: ${error.message}. Please try again later.`  });         
        }
    }    

    public render(): JSX.Element {
        const { projects, isLoading, selectedItem, error } = this.state;

        let tableItems = new ArrayItemProvider<IItemTableAllAlerts>([]);
        if (!isLoading && !error) {
            const transformedTableItems = projects.map(project => ({
                projectName: { iconProps: { iconName: "OpenSource" }, text: project.name },
                numberOfRepositories: project.repositories.length,
                numberOfEnabledAdvancedSecurity: project.advancedSecurityEnabledCount,
                totalActiveAlerts: project.repositories.reduce((acc, repo) => acc + Object.values(repo.alertCounts).reduce((sum, count) => sum + count, 0), 0),
                dependencyAlerts: project.repositories.reduce((acc, repo) => acc + (repo.alertCounts['dependency'] || 0), 0),
                codeAlerts: project.repositories.reduce((acc, repo) => acc + (repo.alertCounts['code'] || 0), 0),
                secretAlerts: project.repositories.reduce((acc, repo) => acc + (repo.alertCounts['secret'] || 0), 0),
            }));
            transformedTableItems.sort((a, b) => b.totalActiveAlerts - a.totalActiveAlerts);
            tableItems = new ArrayItemProvider<IItemTableAllAlerts>(transformedTableItems);
        }   

        return (
            <div style={{ display: 'flex', flexDirection: 'column', width: "100%" }}>
                <Header title="Code Security Overview" titleSize={TitleSize.Large} />
                <Card className="flex-grow custom-card-margin" titleProps={{ text: "Security Alerts", ariaLevel: 3 }} style={{ margin: '20px'}}>
                    <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            {isLoading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '22vh', width: '100vw', position: 'fixed', top: 0, left: 0 }}>
                                        <Spinner size={SpinnerSize.large} label="Loading..." />
                                    </div>
                            ) : error ? (
                                <div className="error-message" style={{ display: 'flex', justifyContent: 'center', height: '100%', color: 'red', padding: 20, textAlign: 'center' }}>
                                    {error}
                                </div>
                            ) : (
                                <div style={{ padding: '3px', overflow: 'auto'}}>
                                    <Card>
                                        <Table<Partial<IItemTableAllAlerts>>
                                            ariaLabel="Security Alerts"
                                            columns={columnsAllAlerts}
                                            itemProvider={tableItems}
                                            selection={this.selection}
                                            onSelect={this.onSelect}
                                        />
                                    </Card>
                                </div>
                            )}
                        </div>
                        {selectedItem && (
                            <div style={{ flex: 1, padding: '3px', overflow: 'auto'}}>
                                <Card
                                    titleProps={{ text: `${selectedItem.name} - Top Alerts Details`, ariaLevel: 3 }}
                                >
                                    {this.renderTopAlertsTables(selectedItem)}
                                </Card>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    }
}

export default HomePage;


showRootComponent(<HomePage />); 