module.exports = function(grunt) {
    grunt.initConfig({
        lambda_deploy: {
            prod: {
                options: {
                    aliases: 'prod',
                    region: 'ap-northeast-2',
                    enableVersioning: true
                },
                arn: '{your lambda arn}'
            }
        },
        lambda_package: {
            prod: {
                options: {
                    package_folder: './app'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-aws-lambda');

    grunt.registerTask('package', ['lambda_package']);
    grunt.registerTask('production', ['lambda_package:prod', 'lambda_deploy:prod']);
};
