//Example layer file.

require.def("alpha",
    ["beta", "gamma"],
    function (beta, gamma) {
        return {
            name: "alpha",
            betaName: beta.name
        };
    }
);

require.def("beta",
    ["gamma"],
    function (gamma) {
        return {
            name: "beta",
            gammaName: gamma.name
        };
    }
);


//Example layer file.

require.def("gamma",
    ["theta", "epsilon"],
    function (theta, epsilon) {
        return {
            name: "gamma",
            thetaName: theta.name,
            epsilonName: epsilon.name
        };
    }
);

require.def("theta",
    function () {
        return {
            name: "theta"
        };
    }
);

require.def("epsilon",
    {
        name: "epsilon"
    }
);
