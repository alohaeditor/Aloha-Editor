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
